"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

export async function createTeacherAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { success: false, error: "No autorizado" };

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, instituteId: true, role: true }
    });

    if (!user || user.role === "SUPERADMIN" || !user.instituteId) {
        return { success: false, error: "Sin permisos" };
    }

    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;
    const role = (formData.get("role") as string) || "TEACHER";

    if (!name || !email || !password) {
        return { success: false, error: "Nombre, Email y Contraseña son obligatorios" };
    }

    try {
        const existingEmail = await prisma.user.findUnique({
            where: { email }
        });

        if (existingEmail) {
            // Verificar si pertenece al mismo instituto
            if (existingEmail.instituteId !== user.instituteId) {
                return { success: false, error: "El correo electrónico ya está registrado en otro instituto." };
            }

            // Verificar si ya tiene el rol asignado
            if (existingEmail.roles.includes(role as any) || existingEmail.role === role) {
                return { success: false, error: `Este usuario ya cuenta con el rol.` };
            }

            // Inyectar el rol seleccionado y mantener los datos y base existentes
            await prisma.user.update({
                where: { email },
                data: {
                    roles: {
                        set: [...existingEmail.roles, role as any]
                    }
                }
            });

            revalidatePath("/teachers");
            revalidatePath("/courses/new");
            revalidatePath("/courses");
            return { success: true };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                phone: phone || null,
                role: role as UserRole,
                roles: [role as UserRole],
                instituteId: user.instituteId,
                hourlyRate: formData.get("hourlyRate") ? parseFloat(formData.get("hourlyRate") as string) : 0
            }
        });

        revalidatePath("/teachers");
        revalidatePath("/courses/new");
        revalidatePath("/courses");
        return { success: true };
    } catch (e: any) {
        console.error("Error creating teacher:", e);
        return { success: false, error: "Error de base de datos al crear profesor." };
    }
}

export async function updateTeacherAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { success: false, error: "No autorizado" };

    const admin = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, instituteId: true, role: true }
    });

    if (!admin || (admin.role !== "ADMIN" && admin.role !== "SUPERADMIN") || !admin.instituteId) {
        return { success: false, error: "Sin permisos" };
    }

    const teacherId = formData.get("teacherId") as string;
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;

    if (!teacherId || !name || !email) {
        return { success: false, error: "ID, Nombre y Email son obligatorios" };
    }

    try {
        // Verificar si el email ya existe en otro usuario
        const existingUser = await prisma.user.findFirst({
            where: {
                email,
                NOT: { id: teacherId }
            }
        });

        if (existingUser) {
            return { success: false, error: "El correo electrónico ya está registrado por otro usuario." };
        }

        await prisma.user.update({
            where: {
                id: teacherId,
                instituteId: admin.instituteId // Seguridad: solo profesores de su propio instituto
            },
            data: {
                name,
                email,
                phone: phone || null,
                hourlyRate: formData.get("hourlyRate") ? parseFloat(formData.get("hourlyRate") as string) : 0
            }
        });

        revalidatePath("/teachers");
        revalidatePath(`/teachers/${teacherId}`);
        return { success: true };
    } catch (e: any) {
        console.error("Error updating teacher:", e);
        return { success: false, error: "Error de base de datos al actualizar profesor." };
    }
}

export async function resetTeacherPassword(teacherId: string, customPassword?: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { success: false, error: "No autorizado" };

    const admin = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, instituteId: true, role: true }
    });

    if (!admin || (admin.role !== "ADMIN" && admin.role !== "SUPERADMIN")) {
        return { success: false, error: "Sin permisos" };
    }

    try {
        const teacher = await prisma.user.findUnique({
            where: { id: teacherId }
        });

        if (!teacher || teacher.role !== "TEACHER" || (admin.role === "ADMIN" && teacher.instituteId !== admin.instituteId)) {
            return { success: false, error: "Profesor no encontrado o sin permisos" };
        }

        const newPassword = customPassword || "docente1234";
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { id: teacherId },
            data: { password: hashedPassword }
        });

        return { success: true, newPassword };
    } catch (e) {
        console.error("Error resetting password:", e);
        return { success: false, error: "Error al restablecer la contraseña" };
    }
}

export async function softDeleteTeacher(teacherId: string) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { success: false, error: "No autorizado" };

    const admin = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, instituteId: true, role: true }
    });

    if (!admin || (admin.role !== "ADMIN" && admin.role !== "SUPERADMIN")) {
        return { success: false, error: "Sin permisos para eliminar profesores" };
    }

    try {
        const teacher = await prisma.user.findUnique({
            where: { id: teacherId }
        });

        if (!teacher || (!teacher.roles.includes("TEACHER" as any) && teacher.role !== "TEACHER") || (admin.role === "ADMIN" && teacher.instituteId !== admin.instituteId)) {
            return { success: false, error: "Profesor no encontrado o sin permisos" };
        }

        // Check if the user has other active roles besides TEACHER
        const remainingRoles = teacher.roles.filter(r => r !== "TEACHER");

        if (remainingRoles.length > 0) {
            // The user is multi-role (e.g. they are also a GUARDIAN)
            // We just remove the TEACHER role from their array, keeping the account ACTIVE.
            await prisma.user.update({
                where: { id: teacherId },
                data: {
                    roles: {
                        set: remainingRoles as any[]
                    }
                }
            });
        } else {
            // The user was strictly a TEACHER and nothing else.
            // We can safely soft-delete the entire account.
            await prisma.user.update({
                where: { id: teacherId },
                data: { status: "DELETED" as any, roles: { set: [] } }
            });
        }

        revalidatePath("/teachers");
        revalidatePath("/dashboard");
        return { success: true };
    } catch (e) {
        console.error("Error soft deleting teacher:", e);
        return { success: false, error: "Error de base de datos al eliminar el profesor" };
    }
}

export async function processTeacherPayment(
    teacherId: string, 
    amount: number, 
    description: string, 
    date: string,
    bonus: number = 0,
    deduction: number = 0,
    notes: string = "",
    startDate?: string,
    endDate?: string,
    lessonIds?: string[]
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { success: false, error: "No autorizado" };

    const admin = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, instituteId: true, role: true }
    });

    if (!admin || (admin.role !== "ADMIN" && admin.role !== "SUPERADMIN") || !admin.instituteId) {
        return { success: false, error: "Sin permisos" };
    }

    try {
        const totalAmount = amount + bonus - deduction;
        const finalDescription = notes ? `${description} (${notes})` : description;

        await prisma.$transaction(async (tx) => {
            const expense = await tx.expense.create({
                data: {
                    description: finalDescription,
                    amount: totalAmount,
                    date: new Date(date),
                    category: "Payroll",
                    recipientId: teacherId,
                    instituteId: admin.instituteId,
                    status: "VALID"
                }
            });

            // Registrar la transacción
            await tx.transaction.create({
                data: {
                    amount: -totalAmount,
                    type: "PAYROLL",
                    method: "EFECTIVO",
                    date: new Date(date),
                    description: finalDescription,
                    expenseId: expense.id,
                    instituteId: admin.instituteId,
                    operatorId: admin.id
                }
            });

            // MARCAR CLASES COMO PAGADAS
            if (lessonIds && lessonIds.length > 0) {
                await tx.lesson.updateMany({
                    where: {
                        id: { in: lessonIds },
                        expenseId: null
                    },
                    data: {
                        expenseId: expense.id
                    }
                });
            } else if (startDate && endDate) {
                await tx.lesson.updateMany({
                    where: {
                        course: { teacherId },
                        date: {
                            gte: new Date(startDate),
                            lte: new Date(endDate)
                        },
                        expenseId: null
                    },
                    data: {
                        expenseId: expense.id
                    }
                });
            }
        });

        revalidatePath(`/teachers/${teacherId}`);
        revalidatePath("/dashboard");
        revalidatePath("/payments");
        revalidatePath("/payments/payroll");
        return { success: true };
    } catch (e) {
        console.error("Error processing payroll payment:", e);
        return { success: false, error: "Error al registrar el pago" };
    }
}

export async function processBulkPayrollAction(
    payments: {
        teacherId: string;
        amount: number;
        description: string;
        date: string;
        bonus: number;
        deduction: number;
        notes: string;
        startDate?: string;
        endDate?: string;
        lessonIds?: string[];
    }[]
) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { success: false, error: "No autorizado" };

    const admin = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, instituteId: true, role: true }
    });

    if (!admin || (admin.role !== "ADMIN" && admin.role !== "SUPERADMIN") || !admin.instituteId) {
        return { success: false, error: "Sin permisos" };
    }

    try {
        await prisma.$transaction(async (tx) => {
            for (const p of payments) {
                const totalAmount = p.amount + p.bonus - p.deduction;
                if (totalAmount <= 0) continue;

                const finalDescription = p.notes ? `${p.description} (${p.notes})` : p.description;

                const expense = await tx.expense.create({
                    data: {
                        description: finalDescription,
                        amount: totalAmount,
                        date: new Date(p.date),
                        category: "Payroll",
                        recipientId: p.teacherId,
                        instituteId: admin.instituteId!,
                        status: "VALID"
                    }
                });

                await tx.transaction.create({
                    data: {
                        amount: -totalAmount,
                        type: "PAYROLL",
                        method: "EFECTIVO",
                        date: new Date(p.date),
                        description: finalDescription,
                        expenseId: expense.id,
                        instituteId: admin.instituteId!,
                        operatorId: admin.id
                    }
                });

                // MARCAR CLASES COMO PAGADAS
                if (p.lessonIds && p.lessonIds.length > 0) {
                    await tx.lesson.updateMany({
                        where: {
                            id: { in: p.lessonIds },
                            expenseId: null
                        },
                        data: {
                            expenseId: expense.id
                        }
                    });
                } else if (p.startDate && p.endDate) {
                    await tx.lesson.updateMany({
                        where: {
                            course: { teacherId: p.teacherId },
                            date: {
                                gte: new Date(p.startDate),
                                lte: new Date(p.endDate)
                            },
                            expenseId: null
                        },
                        data: {
                            expenseId: expense.id
                        }
                    });
                }
            }
        });

        revalidatePath("/dashboard");
        revalidatePath("/payments");
        revalidatePath("/payments/payroll");
        revalidatePath("/teachers");
        
        return { success: true };
    } catch (e) {
        console.error("Error processing bulk payroll:", e);
        return { success: false, error: "Error al procesar los pagos masivos" };
    }
}

