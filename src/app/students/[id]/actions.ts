"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

export async function editStudentAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { success: false, error: "No autorizado" };

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, instituteId: true, role: true }
    });

    if (!user || user.role === "SUPERADMIN" || !user.instituteId) {
        return { success: false, error: "Sin permisos" };
    }

    const studentId = formData.get("studentId") as string;
    const name = formData.get("name") as string;
    const email = formData.get("email")?.toString().toLowerCase().trim();
    const phone = formData.get("phone") as string;
    const birthDateStr = formData.get("birthDate") as string;
    const dni = formData.get("dni") as string;
    const address = formData.get("address") as string;
    const schoolInfo = formData.get("schoolInfo") as string;
    const registeredLevel = formData.get("registeredLevel") as string;

    const guardian1Name = formData.get("guardian1Name") as string;
    const guardian1Relation = formData.get("guardian1Relation") as string;
    const guardian1Phone = formData.get("guardian1Phone") as string;
    const guardian1Email = formData.get("guardian1Email")?.toString().toLowerCase().trim();

    const guardian2Name = formData.get("guardian2Name") as string;
    const guardian2Relation = formData.get("guardian2Relation") as string;
    const guardian2Phone = formData.get("guardian2Phone") as string;
    const guardian2Email = formData.get("guardian2Email")?.toString().toLowerCase().trim();

    if (!studentId || !name) {
        return { success: false, error: "Faltan datos obligatorios (nombre)" };
    }

    try {
        // Validación de seguridad para que solo puedan actualizar estudiantes de su mismo instituto
        const student = await prisma.student.findUnique({
            where: { id: studentId }
        });

        if (!student || student.instituteId !== user.instituteId) {
            return { success: false, error: "Estudiante no encontrado o sin permisos" };
        }

        // Lógica de Sincronización de Email de Tutor
        // Si el email cambió, buscamos si hay una cuenta vinculada para actualizarla
        const updateGuardianEmail = async (oldEmail: string | null, newEmail: string | null) => {
            if (!newEmail || oldEmail === newEmail) return;
            const normalizedNewEmail = newEmail.toLowerCase().trim();
            const normalizedOldEmail = oldEmail?.toLowerCase().trim();

            if (!normalizedOldEmail) return;

            // Buscar el usuario vinculado que tenía el email anterior
            const link = await prisma.guardianStudentLink.findFirst({
                where: {
                    studentId: studentId,
                    guardian: { email: normalizedOldEmail }
                },
                include: { guardian: true }
            });

            if (link) {
                // Verificar que el nuevo email no esté en uso
                const conflict = await prisma.user.findUnique({ where: { email: normalizedNewEmail } });
                if (conflict) {
                    throw new Error(`El email ${normalizedNewEmail} ya está en uso por otro usuario.`);
                }

                // Actualizar el usuario
                await prisma.user.update({
                    where: { id: link.guardianId },
                    data: { email: normalizedNewEmail }
                });
            }
        };

        if (guardian1Email !== student.guardian1Email) {
            await updateGuardianEmail(student.guardian1Email, guardian1Email);
        }
        if (guardian2Email !== student.guardian2Email) {
            await updateGuardianEmail(student.guardian2Email, guardian2Email);
        }

        await prisma.student.update({
            where: { id: studentId },
            data: {
                name,
                email: email || null,
                phone: phone || null,
                birthDate: birthDateStr ? new Date(birthDateStr) : null,
                dni: dni || null,
                address: address || null,
                schoolInfo: schoolInfo || null,
                registeredLevel: registeredLevel || null,
                guardian1Name: guardian1Name || null,
                guardian1Relation: guardian1Relation || null,
                guardian1Phone: guardian1Phone || null,
                guardian1Email: guardian1Email || null,
                guardian2Name: guardian2Name || null,
                guardian2Relation: guardian2Relation || null,
                guardian2Phone: guardian2Phone || null,
                guardian2Email: guardian2Email || null,
            }
        });

        revalidatePath(`/students/${studentId}`);
        revalidatePath("/students");
        return { success: true };
    } catch {
        return { success: false, error: "Error de base de datos al actualizar el estudiante" };
    }
}

export async function resetStudentPassword(studentId: string, customPassword?: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { success: false, error: "No autorizado" };

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, instituteId: true, role: true }
    });

    if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN" && user.role !== "SECRETARY")) {
        return { success: false, error: "Sin permisos" };
    }

    try {
        const student = await prisma.student.findUnique({
            where: { id: studentId }
        });

        if (!student || (["ADMIN", "SECRETARY"].includes(user.role) && student.instituteId !== user.instituteId)) {
            return { success: false, error: "Estudiante no encontrado o sin permisos" };
        }

        const newPassword = customPassword || student.dni || "lingua1234";
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.student.update({
            where: { id: studentId },
            data: { password: hashedPassword }
        });

        return { success: true, newPassword };
    } catch {
        return { success: false, error: "Error al restablecer la contraseña" };
    }
}

export async function softDeleteStudent(studentId: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { success: false, error: "No autorizado" };

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, instituteId: true, role: true }
    });

    if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN" && user.role !== "SECRETARY")) {
        return { success: false, error: "Sin permisos para eliminar estudiantes" };
    }

    try {
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: {
                enrollments: {
                    where: { status: "ACTIVE" }
                }
            }
        });

        if (!student || (["ADMIN", "SECRETARY"].includes(user.role) && student.instituteId !== user.instituteId)) {
            return { success: false, error: "Estudiante no encontrado o sin permisos" };
        }

        if (student.enrollments.length > 0) {
            return { success: false, error: "El alumno tiene inscripciones activas a cursos. Primero dalo de baja de la cursada antes de enviarlo a la papelera." };
        }

        await prisma.student.update({
            where: { id: studentId },
            data: { status: "DELETED" }
        });

        revalidatePath("/students");
        revalidatePath("/dashboard");
        return { success: true };
    } catch {
        return { success: false, error: "Error de base de datos al eliminar el estudiante" };
    }
}

export async function restoreStudentAction(studentId: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { success: false, error: "No autorizado" };

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, instituteId: true, role: true }
    });

    if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN" && user.role !== "SECRETARY")) {
        return { success: false, error: "Sin permisos para restaurar estudiantes" };
    }

    try {
        const student = await prisma.student.findUnique({
            where: { id: studentId }
        });

        if (!student || (["ADMIN", "SECRETARY"].includes(user.role) && student.instituteId !== user.instituteId)) {
            return { success: false, error: "Estudiante no encontrado o sin permisos" };
        }

        await prisma.student.update({
            where: { id: studentId },
            data: { status: "ACTIVE" }
        });

        revalidatePath("/students");
        return { success: true };
    } catch {
        return { success: false, error: "Error de base de datos al restaurar el estudiante" };
    }
}

export async function hardDeleteStudentAction(studentId: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { success: false, error: "No autorizado" };

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, instituteId: true, role: true }
    });

    if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN" && user.role !== "SECRETARY")) {
        return { success: false, error: "Sin permisos para eliminar permanentemente" };
    }

    try {
        const student = await prisma.student.findUnique({
            where: { id: studentId }
        });

        if (!student || (["ADMIN", "SECRETARY"].includes(user.role) && student.instituteId !== user.instituteId)) {
            return { success: false, error: "Estudiante no encontrado o sin permisos" };
        }

        // Transaction to delete relations
        await prisma.$transaction([
            prisma.attendance.deleteMany({ where: { studentId } }),
            prisma.grade.deleteMany({ where: { studentId } }),
            prisma.enrollment.deleteMany({ where: { studentId } }),
            prisma.fee.deleteMany({ where: { studentId } }),
            prisma.student.delete({ where: { id: studentId } })
        ]);

        revalidatePath("/students");
        return { success: true };
    } catch {
        return { success: false, error: "Error al purgar los datos del estudiante" };
    }
}

export async function changeStudentCourseAction(enrollmentId: string, newCourseId: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { success: false, error: "No autorizado" };

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, instituteId: true, role: true }
    });

    if (!user || (user.role !== "ADMIN" && user.role !== "SECRETARY") || !user.instituteId) {
        return { success: false, error: "Solo administradores pueden cambiar el curso" };
    }

    try {
        // Verificar que la inscripción existe y pertenece al instituto
        const enrollment = await prisma.enrollment.findUnique({
            where: { id: enrollmentId },
            include: { student: true }
        });

        if (!enrollment || enrollment.student.instituteId !== user.instituteId) {
            return { success: false, error: "Inscripción no encontrada o sin permisos" };
        }

        // Verificar que el nuevo curso existe y pertenece al instituto
        const newCourse = await prisma.course.findUnique({
            where: { id: newCourseId }
        });

        if (!newCourse || newCourse.instituteId !== user.instituteId) {
            return { success: false, error: "El curso de destino no existe o no pertenece a tu instituto" };
        }

        // Actualizar la inscripción
        await prisma.enrollment.update({
            where: { id: enrollmentId },
            data: { courseId: newCourseId }
        });

        revalidatePath(`/students/${enrollment.studentId}`);
        revalidatePath("/courses");
        return { success: true };
    } catch (e: any) {
        console.error("Error changing student course:", e);
        return { success: false, error: "Error al cambiar el curso del estudiante" };
    }
}

export async function createGuardianAccount(studentId: string, guardianName: string, relation: string, email: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { success: false, error: "No autorizado" };

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, instituteId: true, role: true, roles: true }
    });

    // Validar permisos (solo ADMIN o SUPERADMIN)
    const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN" || user?.role === "SECRETARY" || user?.roles.includes("ADMIN") || user?.roles.includes("SUPERADMIN") || user?.roles.includes("SECRETARY");
    if (!user || !isAdmin || !user.instituteId) {
        return { success: false, error: "Sin permisos" };
    }

    if (!email || !studentId) {
        return { success: false, error: "Email y Estudiante son obligatorios" };
    }

    try {
        const normalizedEmail = email.toLowerCase().trim();
        const defaultPassword = "Modern2026";
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        // 1. Buscar si ya existe el usuario
        const existingUser = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        });

        let targetUserId = "";

        if (existingUser) {
            targetUserId = existingUser.id;
            // 2. Si existe, asegurar que tenga el rol GUARDIAN
            if (!existingUser.roles.includes("GUARDIAN")) {
                await prisma.user.update({
                    where: { id: existingUser.id },
                    data: {
                        roles: {
                            set: [...existingUser.roles, "GUARDIAN" as any]
                        }
                    }
                });
            }
        } else {
            // 3. Si no existe, crear el usuario
            const newUser = await prisma.user.create({
                data: {
                    email: normalizedEmail,
                    name: guardianName,
                    password: hashedPassword,
                    roles: ["GUARDIAN" as any],
                    instituteId: user.instituteId,
                    status: "ACTIVE"
                }
            });
            targetUserId = newUser.id;
        }

        // 4. Crear el vínculo Guardian-Student si no existe
        await prisma.guardianStudentLink.upsert({
            where: {
                guardianId_studentId: {
                    guardianId: targetUserId,
                    studentId: studentId
                }
            },
            create: {
                guardianId: targetUserId,
                studentId: studentId,
                relation: relation
            },
            update: {
                relation: relation
            }
        });

        revalidatePath(`/students/${studentId}`);
        return { success: true };
    } catch (error: any) {
        console.error("Error creating guardian account:", error);
        return { success: false, error: "Error al crear la cuenta del tutor" };
    }
}


export async function generateDataCompletionToken(studentId: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { success: false, error: "No autorizado" };

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, instituteId: true, role: true }
    });

    if (!user || (user.role !== "ADMIN" && user.role !== "SECRETARY" && user.role !== "SUPERADMIN")) {
        return { success: false, error: "Sin permisos" };
    }

    try {
        const student = await prisma.student.findUnique({
            where: { id: studentId }
        });

        if (!student || (user.role !== "SUPERADMIN" && student.instituteId !== user.instituteId)) {
            return { success: false, error: "Estudiante no encontrado" };
        }

        const token = await prisma.studentDataToken.create({
            data: {
                studentId,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            }
        });

        return { success: true, token: token.token };
    } catch (error) {
        console.error("Error generating token:", error);
        return { success: false, error: "Error al generar el token" };
    }
}
