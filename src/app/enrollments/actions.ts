"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { INSTITUTE_STAFF, requireRole } from "@/lib/authz";
import { ENROLLMENT_FEE_MONTH, EXAM_FEE_MONTH } from "@/lib/utils";
import { finalExamLessonWrites, syncFinalExamLesson } from "@/lib/feeDue";
import { instituteMonth } from "@/lib/dates";
import { monthlyFeesToIssue } from "@/lib/monthlyFees";

export async function createEnrollmentAction(formData: FormData) {
    const user = await requireRole(INSTITUTE_STAFF);
    if (!user) return { success: false, error: "Sin permisos" };

    const studentId = formData.get("studentId") as string;
    const courseId = formData.get("courseId") as string;

    if (!studentId || !courseId) {
        return { success: false, error: "Debe seleccionar un alumno y un curso" };
    }

    try {
        // Validación extra: Verificar si ya existe esta inscripción concreta en el mundo real
        const existing = await prisma.enrollment.findUnique({
            where: { studentId_courseId: { studentId, courseId } }
        });

        if (existing && existing.status === "ACTIVE") {
            return { success: false, error: "El estudiante ya se encuentra inscripto en este curso" };
        }

        // Si existe pero está cerrada, se **reactiva** en vez de crear otra.
        //
        // Hace falta desde FIN-23: antes, sacar a un alumno de un curso borraba la
        // fila, así que volver a inscribirlo era crear una nueva y el índice único
        // `[studentId, courseId]` nunca se cruzaba. Ahora la inscripción se conserva,
        // y sin esto el alumno que dejó un curso no podría volver nunca a ese curso.
        //
        // Reactivar es además lo correcto y no un rodeo: mismo alumno y mismo curso
        // es la misma inscripción, y así se queda con sus cuotas, su precio propio y
        // su modalidad de cobro en lugar de empezar de cero.
        const enrollment = existing
            ? await prisma.enrollment.update({
                where: { id: existing.id },
                data: { status: "ACTIVE" },
                include: { course: true }
            })
            : await prisma.enrollment.create({
                data: {
                    studentId,
                    courseId,
                    status: "ACTIVE",
                },
                include: {
                    course: true
                }
            });

        // Año lectivo de la inscripción. La matrícula es anual y por curso, así que
        // el año lo tiene que dar el curso; el de calendario es sólo el recambio de
        // cuando el curso no dice cuándo empieza.
        //
        // `getUTCFullYear` porque las fechas se guardan a medianoche UTC: un curso
        // que arranca el 1 de enero, leído en hora local, cae en diciembre del año
        // anterior.
        const calendarYear = instituteMonth().year;
        const academicYear = enrollment.course.startDate
            ? enrollment.course.startDate.getUTCFullYear()
            : calendarYear;

        // 3. Vincular o Generar la "Matrícula" (Enrollment Fee) automáticamente
        //
        // El precio propio de la inscripción manda, igual que en la corrida anual.
        // Una inscripción nueva no lo tiene; una reactivada puede traerlo.
        const finalEnrollmentPrice = enrollment.customEnrollmentPrice ?? enrollment.course.enrollmentPrice;

        // A una inscripción reactivada no se le vuelve a emitir la matrícula del año
        // si ya la tiene: la pagó cuando entró. Sin esto, el `create` de más abajo
        // choca contra la restricción única de FIN-06 y el alta falla entera con un
        // mensaje genérico.
        const alreadyHasEnrollmentFee = existing
            ? (await prisma.fee.count({
                where: { enrollmentId: enrollment.id, type: "ENROLLMENT", year: academicYear }
            })) > 0
            : false;

        if (finalEnrollmentPrice > 0 && !alreadyHasEnrollmentFee) {
            // La matrícula es por curso (FIN-12): esta inscripción lleva la suya.
            // Antes de emitirla buscamos una matrícula anticipada sin vincular —la
            // seña que se cobró antes de saber a qué curso iba— y la consumimos.
            // Sólo la primera inscripción del alumno la aprovecha; la segunda paga
            // su propia matrícula.
            //
            // Si el curso no tiene fecha de inicio no sabemos de qué ciclo es, así
            // que aceptamos también la del año siguiente, prefiriendo siempre la más
            // vieja. Es el caso normal del instituto: cobrar la seña de 2027 en
            // diciembre y armar los cursos de 2027 también en diciembre. Buscando
            // sólo por año de calendario esa seña no aparecía y el alumno terminaba
            // con la seña pagada más una matrícula del año en curso a precio de lista.
            const candidateYears = enrollment.course.startDate
                ? [academicYear]
                : [academicYear, academicYear + 1];

            const existingStandaloneFee = await prisma.fee.findFirst({
                where: {
                    studentId,
                    type: "ENROLLMENT",
                    year: { in: candidateYears },
                    enrollmentId: null
                },
                orderBy: { year: "asc" }
            });

            if (existingStandaloneFee) {
                // Vincular la existente, conservando **su** año: el de la seña es el
                // dato bueno, el `academicYear` de acá es el que puede ser una
                // suposición cuando el curso no trae fecha.
                await prisma.fee.update({
                    where: { id: existingStandaloneFee.id },
                    data: { enrollmentId: enrollment.id, month: ENROLLMENT_FEE_MONTH }
                });
            } else {
                // Crear una nueva
                await prisma.fee.create({
                    data: {
                        studentId,
                        enrollmentId: enrollment.id,
                        type: "ENROLLMENT",
                        originalAmount: finalEnrollmentPrice,
                        paidAmount: 0,
                        status: "PENDING",
                        month: ENROLLMENT_FEE_MONTH,
                        year: academicYear,
                        instituteId: user.instituteId as string
                    }
                });
            }
        }

        // 4. La cuota del mes en curso (FIN-29). La corrida del botón la emite para
        // los que ya estaban inscriptos; el que entra después no la tenía, y como no
        // había fila, tampoco figuraba en deudores. Se cobra entera, sin importar el
        // día del mes. La regla es la de la corrida, en el mismo lugar: si la
        // inscripción no se cobra por mes, ya tiene la cuota o el instituto se la
        // borró, no se emite nada.
        const period = instituteMonth();
        const { fees: monthlyFees } = await monthlyFeesToIssue(prisma, {
            instituteId: user.instituteId as string,
            month: period.month,
            year: period.year,
            enrollmentId: enrollment.id
        });

        if (monthlyFees.length > 0) {
            await prisma.fee.createMany({ data: monthlyFees, skipDuplicates: true });
        }

        // Revalidamos las pantallas afectadas
        revalidatePath(`/courses/${courseId}`);
        revalidatePath("/courses");
        revalidatePath("/students");
        revalidatePath("/payments");
        return {
            success: true,
            // Para que la pantalla diga qué se le emitió: quien inscribe es quien
            // después cobra, y tiene que saber que ese mes ya está en la cuenta.
            monthlyFee: monthlyFees.length > 0
                ? { month: period.month, year: period.year, amount: monthlyFees[0].originalAmount }
                : null
        };
    } catch (e: any) {
        // Error de Prisma si falla la constraint única u otro
        return { success: false, error: "Error al inscribir al estudiante. Verifica su estado." };
    }
}

export async function toggleExamRegistrationAction(enrollmentId: string, takesExam: boolean) {
    const user = await requireRole(INSTITUTE_STAFF);
    if (!user) return { success: false, error: "Sin permisos" };

    try {
        const enrollment = await prisma.enrollment.findUnique({
            where: { id: enrollmentId },
            include: { course: true }
        });

        if (!enrollment || enrollment.course.instituteId !== user.instituteId) {
            return { success: false, error: "Inscripción no encontrada" };
        }

        const currentYear = instituteMonth().year;

        await prisma.$transaction(async (tx) => {
            await applyExamRegistration(tx, enrollment, enrollment.course, takesExam, currentYear, user.instituteId as string);
        });

        revalidatePath(`/students/${enrollment.studentId}`);
        revalidatePath(`/courses/${enrollment.courseId}`);
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Error al registrar para examen" };
    }
}

/**
 * Carga el examen final para todo el curso de una vez.
 *
 * Rinden casi todos, así que la pantalla arranca con todos tildados y la
 * secretaria destilda a los que no rinden; antes era entrar a la ficha de cada
 * alumno y prender el interruptor. `takingEnrollmentIds` son los que rinden: el
 * resto de las inscripciones activas queda sin examen. Cada alumno pasa por la
 * misma regla que el interruptor de su ficha, que sigue sirviendo para los casos
 * sueltos.
 *
 * Va en sentencias masivas, no en un bucle por alumno dentro de una transacción
 * interactiva: así estaba y falló en producción con Children 4 L-M, 12 alumnos,
 * el mismo umbral de tamaño que tiró la publicación de boletines (BUG-23 y
 * BUG-25). Las lecturas van antes y las escrituras en un solo lote, así que
 * la cantidad de sentencias no depende del tamaño del curso.
 */
export async function setCourseExamRegistrationsAction(courseId: string, takingEnrollmentIds: string[]) {
    const user = await requireRole(INSTITUTE_STAFF);
    if (!user) return { success: false, error: "Sin permisos" };

    try {
        const course = await prisma.course.findUnique({
            where: { id: courseId },
            include: { enrollments: { where: { status: "ACTIVE" } } }
        });

        if (!course || course.instituteId !== user.instituteId) {
            return { success: false, error: "Curso no encontrado" };
        }

        const taking = new Set(takingEnrollmentIds);
        const currentYear = instituteMonth().year;
        const takers = course.enrollments.filter((e) => taking.has(e.id));
        // El que no rinde y nunca rindió no tiene nada que deshacer.
        const leavers = course.enrollments.filter((e) => !taking.has(e.id) && e.takesExam);
        const takerIds = takers.map((e) => e.id);
        const leaverIds = leavers.map((e) => e.id);

        // El derecho de examen es uno por año: se busca por inscripción y año,
        // ignorando el mes, igual que `applyExamRegistration`.
        const [examFees, lessonWrites] = await Promise.all([
            prisma.fee.findMany({
                where: { enrollmentId: { in: takerIds }, type: "EXAM", year: currentYear },
                select: { enrollmentId: true }
            }),
            takers.length > 0 ? finalExamLessonWrites(prisma, courseId, course.examDate) : Promise.resolve([]),
        ]);

        const withFee = new Set(examFees.map((f) => f.enrollmentId));
        const newFees = takers.flatMap((e) => {
            const price = e.customExamPrice !== null ? e.customExamPrice : course.examPrice;
            if (price <= 0 || withFee.has(e.id)) return [];
            return [{
                studentId: e.studentId,
                enrollmentId: e.id,
                type: "EXAM" as const,
                originalAmount: price,
                paidAmount: 0,
                status: "PENDING" as const,
                month: EXAM_FEE_MONTH,
                year: currentYear,
                instituteId: user.instituteId as string
            }];
        });

        const [, , created] = await prisma.$transaction([
            prisma.enrollment.updateMany({ where: { id: { in: takerIds } }, data: { takesExam: true } }),
            prisma.enrollment.updateMany({ where: { id: { in: leaverIds } }, data: { takesExam: false } }),
            // `skipDuplicates` cubre el doble clic: la restricción única ya
            // dice "uno por inscripción y año" desde FIN-17.
            prisma.fee.createMany({ data: newFees, skipDuplicates: true }),
            // Se saca la cuota sólo si está impaga. La condición va en la
            // sentencia y no en una lectura previa, por si entró un pago en el
            // medio.
            prisma.fee.deleteMany({
                where: { enrollmentId: { in: leaverIds }, type: "EXAM", year: currentYear, paidAmount: 0, status: "PENDING" }
            }),
            ...lessonWrites,
        ]);

        revalidatePath(`/courses/${courseId}`);
        revalidatePath("/students/[id]", "page");
        revalidatePath("/payments");
        return { success: true, registered: takers.length, feesCreated: (created as Prisma.BatchPayload).count };
    } catch (e: any) {
        // El detalle queda en el log de Vercel; antes se perdía y no había cómo
        // saber por qué había fallado.
        console.error("Error cargando el examen final del curso:", { courseId, error: e });
        return { success: false, error: "Error al cargar el examen final del curso" };
    }
}

/**
 * Deja una inscripción rindiendo o sin rendir el examen final del año, con su
 * cuota y la clase de examen del curso. Devuelve si emitió una cuota nueva.
 */
async function applyExamRegistration(
    tx: Prisma.TransactionClient,
    enrollment: { id: string; studentId: string; courseId: string; customExamPrice: number | null },
    course: { examPrice: number; examDate: Date | null },
    takesExam: boolean,
    currentYear: number,
    instituteId: string
): Promise<boolean> {
    let feeCreated = false;

    await tx.enrollment.update({
        where: { id: enrollment.id },
        data: { takesExam }
    });

    if (takesExam) {
        const finalExamPrice = enrollment.customExamPrice !== null
            ? enrollment.customExamPrice
            : course.examPrice;

        if (finalExamPrice > 0) {
            // El chequeo previo busca por inscripción y año, **ignorando el
            // mes**, que es lo correcto: el derecho de examen es uno por año.
            // Hasta FIN-17 esa regla vivía sólo acá —la restricción única
            // incluye el mes, y la cuota se guardaba con el mes en que se
            // tocaba el interruptor, así que dos meses distintos no chocaban—.
            // Con `EXAM_FEE_MONTH` la base dice lo mismo que esta consulta.
            const existingFee = await tx.fee.findFirst({
                where: {
                    studentId: enrollment.studentId,
                    enrollmentId: enrollment.id,
                    type: "EXAM",
                    year: currentYear
                }
            });

            if (!existingFee) {
                await tx.fee.create({
                    data: {
                        studentId: enrollment.studentId,
                        enrollmentId: enrollment.id,
                        type: "EXAM",
                        originalAmount: finalExamPrice,
                        paidAmount: 0,
                        status: "PENDING",
                        month: EXAM_FEE_MONTH,
                        year: currentYear,
                        instituteId
                    }
                });
                feeCreated = true;
            }
        }

        // La clase del examen final, en la fecha del examen. Sin fecha todavía no
        // va: aparece cuando se carga en el curso (`updateCourseAction`).
        await syncFinalExamLesson(tx, enrollment.courseId, course.examDate);
    } else {
        // Se saca la cuota sólo si está impaga
        const existingFee = await tx.fee.findFirst({
            where: {
                studentId: enrollment.studentId,
                enrollmentId: enrollment.id,
                type: "EXAM",
                year: currentYear
            }
        });

        if (existingFee && existingFee.paidAmount === 0 && existingFee.status === "PENDING") {
            await tx.fee.delete({
                where: { id: existingFee.id }
            });
        }
    }

    return feeCreated;
}
