"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireLessonWriteAccess } from "@/lib/lessonAccess";

/** Estados de matrícula que la pantalla de asistencia lista como alumnos del curso. */
const ENROLLED_STATUSES = ["ACTIVE", "FINISHED"];

/**
 * El chequeo que estaba acá pasó a `requireLessonWriteAccess` sin cambios: las
 * notas necesitaban exactamente el mismo, y tenerlo dos veces es tenerlo una vez
 * y media (FEAT-07).
 */
function authorizeLessonAttendance(lessonId: string, courseId: string) {
    return requireLessonWriteAccess(lessonId, courseId, "la asistencia");
}

export async function saveLessonAttendanceAction(
    lessonId: string,
    courseId: string,
    records: { studentId: string; status: "PRESENT" | "ABSENT" | "LATE" | "JUSTIFIED"; notes?: string }[]
) {
    const authorized = await authorizeLessonAttendance(lessonId, courseId);
    if ("error" in authorized) {
        return { success: false, error: authorized.error };
    }

    if (records.length === 0) {
        return { success: true };
    }

    try {
        // Sólo se escribe asistencia de alumnos matriculados en el curso. Se
        // filtra en lugar de rechazar el parte entero: si a alguien le dieron de
        // baja la matrícula mientras el profesor tenía la pantalla abierta, se
        // guarda el resto igual en vez de perderle la clase.
        const enrolled = await prisma.enrollment.findMany({
            where: {
                courseId: courseId,
                studentId: { in: records.map(r => r.studentId) },
                status: { in: ENROLLED_STATUSES }
            },
            select: { studentId: true }
        });

        const enrolledIds = new Set(enrolled.map(e => e.studentId));
        const validRecords = records.filter(r => enrolledIds.has(r.studentId));

        if (validRecords.length === 0) {
            return { success: false, error: "Ninguno de los alumnos enviados está matriculado en el curso." };
        }

        if (validRecords.length < records.length) {
            console.warn("Asistencia: se descartaron alumnos no matriculados", {
                lessonId, courseId, descartados: records.length - validRecords.length
            });
        }

        // El parte entero se escribe en **dos sentencias masivas**, no en una por
        // alumno. Lo que importa acá no es el tiempo total sino **cuánto tiempo se
        // retiene una conexión del pool**, que es de 5: mientras un profesor
        // guarda, los demás esperan.
        //
        // Medido contra Postgres local con 25 alumnos (el curso más grande del
        // cliente), contando las sentencias que Prisma manda de verdad:
        //
        //   bucle en `$transaction` interactiva (código viejo)   53 alta / 78 regrabado
        //   un `upsert` por alumno en `$transaction([...])`      27 / 27
        //   estas dos sentencias                                  4 / 4
        //
        // El regrabado del código viejo era el peor caso y es el caso común —el
        // profesor corrige y vuelve a guardar—: 78 sentencias, porque el `update`
        // de Prisma hace un SELECT antes de cada UPDATE. Con la base en otra
        // región (~65 ms de ida y vuelta) eso da ~5 s, que es exactamente el tope
        // de la transacción interactiva. Ahí se caía el parte entero (BUG-07).
        //
        // La transacción que queda **no es la que se sacó en los informes**: aquella
        // mantenía la conexión tomada a lo largo de N viajes con el control
        // volviendo a JS en el medio. Ésta son dos sentencias en un solo lote. Y
        // sale gratis: `createMany` abre su propio BEGIN/COMMIT igual, así que
        // envolver las dos no agrega ni una sentencia y a cambio el parte queda
        // atómico.
        //
        // Por qué un UPDATE crudo y no `updateMany`: cada alumno lleva su propio
        // estado y su propia nota, y `updateMany` aplica **un** valor a todas las
        // filas que matchean. El `VALUES` es la forma de mandar 25 valores
        // distintos en una sentencia. Va parametrizado.
        const values = Prisma.join(
            validRecords.map(record => Prisma.sql`(
                ${record.studentId}::text,
                ${record.status}::"AttendanceStatus",
                ${record.notes || null}::text
            )`)
        );

        await prisma.$transaction([
            // Los que ya tenían fila. Conserva `id` y `createdAt`: no se borra y
            // se recrea, así que sigue constando cuándo se tomó la asistencia por
            // primera vez.
            prisma.$executeRaw`
                UPDATE "Attendance" a
                   SET "status" = v."status",
                       "notes" = v."notes",
                       "updatedAt" = NOW()
                  FROM (VALUES ${values}) AS v("studentId", "status", "notes")
                 WHERE a."studentId" = v."studentId"
                   AND a."lessonId" = ${lessonId}
            `,
            // Los que no la tenían. `skipDuplicates` se apoya en
            // `@@unique([studentId, lessonId])`, y ahí muere la carrera con el
            // kiosco de QR: si el escáner creó la fila en el medio, ésta se saltea
            // en vez de chocar y arrastrar todo. Es el mismo recurso que FIN-06.
            prisma.attendance.createMany({
                data: validRecords.map(record => ({
                    studentId: record.studentId,
                    lessonId: lessonId,
                    status: record.status,
                    notes: record.notes || null,
                })),
                skipDuplicates: true
            })
        ]);

        revalidatePath(`/courses/${courseId}`);
        revalidatePath(`/courses/${courseId}/lessons/${lessonId}/attendance`);

        return { success: true };
    } catch (error: any) {
        // El error crudo de Prisma queda en el log del servidor, no en la
        // pantalla de la profesora. Antes se devolvía `error.message` tal cual:
        // le llegaba un `P2028` a quien sólo quería guardar la lista.
        console.error("Error guardando asistencia:", { lessonId, courseId, error });
        return { success: false, error: "Error al guardar el parte de asistencia." };
    }
}

export async function scanAttendanceQRAction(
    lessonId: string,
    courseId: string,
    studentId: string
) {
    const authorized = await authorizeLessonAttendance(lessonId, courseId);
    if ("error" in authorized) {
        return { success: false, error: authorized.error };
    }

    try {
        // 1. Validar que el alumno pertenece al curso
        const enrollment = await prisma.enrollment.findUnique({
            where: {
                studentId_courseId: {
                    studentId: studentId,
                    courseId: courseId
                }
            },
            include: { student: true }
        });

        if (!enrollment || enrollment.status !== "ACTIVE") {
            return { 
                success: false, 
                error: "El estudiante no pertenece a este curso o no está activo." 
            };
        }

        // 2. Marcar presente
        await prisma.$transaction(async (tx) => {
            const existing = await tx.attendance.findUnique({
                where: {
                    studentId_lessonId: {
                        studentId: studentId,
                        lessonId: lessonId
                    }
                }
            });

            if (existing) {
                // Solo pisarlo si no era PRESENT (quizás le habían puesto Ausente por error)
                if (existing.status !== "PRESENT") {
                    await tx.attendance.update({
                        where: { id: existing.id },
                        data: { status: "PRESENT", notes: "Marcado vía QR Kiosk" }
                    });
                }
            } else {
                await tx.attendance.create({
                    data: {
                        studentId: studentId,
                        lessonId: lessonId,
                        status: "PRESENT",
                        notes: "Marcado vía QR Kiosk"
                    }
                });
            }
        });

        // 3. Revalidar cache suavemente
        revalidatePath(`/courses/${courseId}`);
        revalidatePath(`/courses/${courseId}/lessons/${lessonId}/attendance`);

        return { 
            success: true, 
            studentName: enrollment.student.name 
        };

    } catch (error: any) {
        console.error("QR Scan Error:", error);
        return { success: false, error: "Error interno al procesar el código QR." };
    }
}
