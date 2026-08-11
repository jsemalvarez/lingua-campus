"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { INSTITUTE_STAFF, requireRole } from "@/lib/authz";
import { ENROLLMENT_FEE_MONTH } from "@/lib/utils";

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

        if (existing) {
            return { success: false, error: "El estudiante ya se encuentra inscripto en este curso" };
        }

        // Crear la inscripción oficial
        const enrollment = await prisma.enrollment.create({
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
        const calendarYear = new Date().getFullYear();
        const academicYear = enrollment.course.startDate
            ? enrollment.course.startDate.getUTCFullYear()
            : calendarYear;

        // 3. Vincular o Generar la "Matrícula" (Enrollment Fee) automáticamente
        const finalEnrollmentPrice = enrollment.course.enrollmentPrice;

        if (finalEnrollmentPrice > 0) {
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

        // Revalidamos las pantallas afectadas
        revalidatePath(`/courses/${courseId}`);
        revalidatePath("/courses");
        revalidatePath("/students");
        revalidatePath("/payments");
        return { success: true };
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

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth() + 1;

        // Start transaction for consistency
        await prisma.$transaction(async (tx) => {
            // 1. Update the enrollment flag
            await tx.enrollment.update({
                where: { id: enrollmentId },
                data: { takesExam }
            });

            if (takesExam) {
                // 2. Calculate the exam price
                const finalExamPrice = enrollment.customExamPrice !== null
                    ? enrollment.customExamPrice
                    : enrollment.course.examPrice;

                if (finalExamPrice > 0) {
                    // Check if fee already exists
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
                                month: currentMonth,
                                year: currentYear,
                                instituteId: user.instituteId as string
                            }
                        });
                    }
                }

                // 3. Ensure a Lesson of type EXAM exists for this course
                const existingExamLesson = await tx.lesson.findFirst({
                    where: {
                        courseId: enrollment.courseId,
                        type: "EXAM"
                    }
                });

                if (!existingExamLesson) {
                    await tx.lesson.create({
                        data: {
                            courseId: enrollment.courseId,
                            type: "EXAM",
                            date: new Date(),
                            topic: "Examen Final",
                            content: "Generado automáticamente por el registro de exámenes finales."
                        }
                    });
                }

            } else {
                // Remove the Exam Fee if it is unpaid
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
        });

        revalidatePath(`/students/${enrollment.studentId}`);
        revalidatePath(`/courses/${enrollment.courseId}`);
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Error al registrar para examen" };
    }
}
