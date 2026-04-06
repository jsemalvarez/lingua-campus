"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

async function getAuthAndInstitute() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return null;

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, instituteId: true, role: true }
    });

    if (!user || user.role === "SUPERADMIN" || !user.instituteId) return null;
    return user;
}

export async function createPaymentAction(formData: FormData) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    const feeId = formData.get("feeId") as string;
    const amountStr = formData.get("amount") as string;
    const surchargeStr = formData.get("surcharge") as string;
    const discountStr = formData.get("discount") as string;
    const method = formData.get("method") as string;
    const notes = formData.get("notes") as string;

    const amount = parseFloat(amountStr);
    const surcharge = parseFloat(surchargeStr) || 0;
    const discount = parseFloat(discountStr) || 0;

    if (!feeId || isNaN(amount) || amount <= 0) {
        return { success: false, error: "Datos del pago inválidos" };
    }

    // El capital que realmente se acredita a la deuda es:
    // Lo que pagó + lo que se le perdonó - lo que es recargo (interés)
    const capitalContribution = amount + discount - surcharge;

    try {
        // 1. Obtener la Cuota (Fee)
        const fee = await prisma.fee.findUnique({
            where: { id: feeId },
        });

        if (!fee) return { success: false, error: "Cuota no encontrada" };

        const totalPaidAfter = fee.paidAmount + capitalContribution;

        // 2. Transacción para crear el pago y actualizar la cuota
        await prisma.$transaction(async (tx) => {
            // Crear el registro de transacción individual con los ajustes
            const payment = await tx.payment.create({
                data: {
                    feeId,
                    amount,
                    surcharge,
                    discount,
                    method,
                    notes,
                    date: new Date()
                }
            });

            // Asiento en el Libro Mayor
            await tx.transaction.create({
                data: {
                    instituteId: user.instituteId as string,
                    amount: amount, // El pago real que ingresó
                    type: "PAYMENT",
                    method,
                    date: new Date(),
                    description: `Pago Cuota/Matrícula`,
                    paymentId: payment.id,
                    operatorId: user.id
                }
            });

            // Determinar nuevo estado (basado en el capital cubierto)
            let newStatus: any = "PARTIAL";
            if (totalPaidAfter >= fee.originalAmount) {
                newStatus = "PAID";
            }

            // Actualizar el "Snapshot" de la cuota
            await tx.fee.update({
                where: { id: feeId },
                data: {
                    paidAmount: totalPaidAfter,
                    status: newStatus,
                    datePaid: newStatus === "PAID" ? new Date() : fee.datePaid
                }
            });
        });

        revalidatePath("/payments");
        revalidatePath("/payments/debtors");
        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { success: false, error: "Error al registrar el pago" };
    }
}

export async function getStudentPendingFeesAction(studentId: string) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    try {
        const fees = await prisma.fee.findMany({
            where: {
                studentId,
                status: { in: ["PENDING", "PARTIAL"] },
                originalAmount: { gt: 0 },
                instituteId: user.instituteId as string
            },
            include: {
                enrollment: {
                    include: { course: { select: { name: true } } }
                }
            },
            orderBy: [
                { year: "desc" },
                { month: "desc" }
            ]
        });

        return { success: true, fees };
    } catch (e: any) {
        return { success: false, error: "Error al cargar cuotas pendientes" };
    }
}

export async function createExpenseAction(formData: FormData) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    const description = formData.get("description") as string;
    const amountStr = formData.get("amount") as string;
    const category = formData.get("category") as string;
    const dateStr = formData.get("date") as string;
    const ticketNumber = formData.get("ticketNumber") as string;

    const recipientId = formData.get("recipientId") as string;

    const amount = parseFloat(amountStr);

    if (!description || isNaN(amount) || amount <= 0) {
        return { success: false, error: "Descripción y un monto mayor a 0 son obligatorios" };
    }

    try {
        await prisma.$transaction(async (tx) => {
            const exp = await tx.expense.create({
                data: {
                    description: description.trim(),
                    amount,
                    category: category || "OTROS",
                    ticketNumber: ticketNumber?.trim() || null,
                    date: dateStr ? new Date(`${dateStr}T00:00:00Z`) : new Date(),
                    instituteId: user.instituteId as string,
                    recipientId: recipientId || null
                }
            });

            await tx.transaction.create({
                data: {
                    instituteId: user.instituteId as string,
                    amount: -amount, // Salida de dinero
                    type: category === "Payroll" ? "PAYROLL" : "EXPENSE",
                    method: "EFECTIVO", // Por defecto
                    date: exp.date,
                    description: `Gasto: ${exp.category} ${exp.ticketNumber ? '- Ticket: '+exp.ticketNumber : ''}`,
                    expenseId: exp.id,
                    operatorId: user.id
                }
            });
        });

        revalidatePath("/payments");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Error al cargar gasto operativo" };
    }
}

export async function voidExpenseAction(expenseId: string, reason?: string) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    try {
        await prisma.$transaction(async (tx) => {
            const expense = await tx.expense.findFirst({
                where: { id: expenseId, instituteId: user.instituteId as string }
            });

            if (!expense) throw new Error("Gasto no encontrado");
            if (expense.status === "VOIDED") throw new Error("El gasto ya está anulado");

            // Marcar gasto como anulado
            await tx.expense.update({
                where: { id: expense.id },
                data: { status: "VOIDED" }
            });

            // Marcar transacción original como anulada
            await tx.transaction.updateMany({
                where: { expenseId: expense.id },
                data: { status: "VOIDED" }
            });

            // Generar contra-asiento
            await tx.transaction.create({
                data: {
                    instituteId: user.instituteId as string,
                    amount: expense.amount, // Positivo para compensar el gasto negativo original
                    type: "ADJUSTMENT",
                    method: "EFECTIVO",
                    date: new Date(),
                    description: `Anulación de Gasto #${expense.id.slice(-6)}`,
                    expenseId: expense.id,
                    operatorId: user.id
                }
            });
        });

        revalidatePath("/payments");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message || "Error al anular el gasto" };
    }
}

export async function createIncomeAction(formData: FormData) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    const description = formData.get("description") as string;
    const amountStr = formData.get("amount") as string;
    const category = formData.get("category") as string;
    const dateStr = formData.get("date") as string;
    const method = formData.get("method") as string;
    const ticketNumber = formData.get("ticketNumber") as string;
    const studentId = formData.get("studentId") as string;

    const amount = parseFloat(amountStr);

    if (!description || isNaN(amount) || amount <= 0) {
        return { success: false, error: "Descripción y un monto mayor a 0 son obligatorios" };
    }

    try {
        await prisma.$transaction(async (tx) => {
            const inc = await tx.miscellaneousIncome.create({
                data: {
                    description: description.trim(),
                    amount,
                    category: category || "OTROS",
                    method: method || "EFECTIVO",
                    ticketNumber: ticketNumber?.trim() || null,
                    date: dateStr ? new Date(`${dateStr}T00:00:00Z`) : new Date(),
                    instituteId: user.instituteId as string,
                    studentId: studentId || null
                }
            });

            await tx.transaction.create({
                data: {
                    instituteId: user.instituteId as string,
                    amount: amount,
                    type: "MISC_INCOME",
                    method: inc.method,
                    date: inc.date,
                    description: `Ingreso: ${inc.category} ${inc.ticketNumber ? '- '+inc.ticketNumber : ''}`,
                    miscIncomeId: inc.id,
                    operatorId: user.id
                }
            });
        });

        revalidatePath("/payments");
        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { success: false, error: "Error al registrar el ingreso extra" };
    }
}

export async function generateStandaloneEnrollmentFeeAction(formData: FormData) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) return { success: false, error: "No autorizado" };

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, instituteId: true }
    });

    if (!user || !user.instituteId) return { success: false, error: "Sin permisos" };

    const studentId = formData.get("studentId") as string;
    const year = parseInt(formData.get("year") as string);
    const amount = parseFloat(formData.get("amount") as string);

    if (!studentId || isNaN(year) || isNaN(amount)) {
        return { success: false, error: "Datos incompletos" };
    }

    try {
        // Verificar si ya existe una matrícula de este tipo para este año (para evitar duplicados accidentales)
        const existing = await prisma.fee.findFirst({
            where: {
                studentId,
                year,
                type: "ENROLLMENT",
                instituteId: user.instituteId
            }
        });

        if (existing) {
            return { success: false, error: `Ya existe una matrícula registrada para este alumno en el año ${year}` };
        }

        await prisma.fee.create({
            data: {
                studentId,
                year,
                month: new Date().getMonth() + 1, // Mes administrativo de creación
                type: "ENROLLMENT",
                originalAmount: amount,
                paidAmount: 0,
                status: "PENDING",
                instituteId: user.instituteId
            }
        });

        revalidatePath("/payments");
        return { success: true };
    } catch (e) {
        return { success: false, error: "Error al generar la matrícula" };
    }
}

export async function voidPaymentAction(paymentId: string, reason?: string) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    try {
        await prisma.$transaction(async (tx) => {
            const payment = await tx.payment.findUnique({
                where: { id: paymentId },
                include: { fee: true }
            });

            if (!payment) throw new Error("Pago no encontrado");
            if (payment.status === "VOIDED") throw new Error("El pago ya fue anulado");
            if (payment.fee.instituteId !== user.instituteId) throw new Error("Acceso denegado");

            // Marcar el pago como anulado
            await tx.payment.update({
                where: { id: payment.id },
                data: { status: "VOIDED" }
            });

            // Marcar transacción original como anulada
            await tx.transaction.updateMany({
                where: { paymentId: payment.id },
                data: { status: "VOIDED" }
            });

            // Contra-asiento
            const adjustmentDescription = reason
                ? `Anulación de Pago de Cuota #${payment.id.slice(-6)} - Motivo: ${reason}`
                : `Anulación de Pago de Cuota #${payment.id.slice(-6)}`;
                
            await tx.transaction.create({
                data: {
                    instituteId: user.instituteId as string,
                    amount: -payment.amount, // Salida de dinero para revertir el ingreso
                    type: "REFUND",
                    method: payment.method,
                    date: new Date(),
                    description: adjustmentDescription,
                    paymentId: payment.id,
                    operatorId: user.id
                }
            });

            // Recalcular balance de la cuenta
            const capitalContribution = payment.amount + payment.discount - payment.surcharge;
            const newPaidAmount = Math.max(0, payment.fee.paidAmount - capitalContribution);

            let newStatus: any = "PARTIAL";
            if (newPaidAmount === 0) newStatus = "PENDING";

            await tx.fee.update({
                where: { id: payment.feeId },
                data: {
                    paidAmount: newPaidAmount,
                    status: newStatus,
                    datePaid: newStatus === "PAID" ? payment.fee.datePaid : null
                }
            });
        });

        revalidatePath("/payments");
        revalidatePath("/payments/debtors");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message || "Error al anular pago" };
    }
}

export async function voidIncomeAction(incomeId: string, reason?: string) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    try {
        await prisma.$transaction(async (tx) => {
            const income = await tx.miscellaneousIncome.findFirst({
                where: { id: incomeId, instituteId: user.instituteId as string }
            });

            if (!income) throw new Error("Ingreso no encontrado");
            if (income.status === "VOIDED") throw new Error("El ingreso ya fue anulado");

            // Marcar ingreso como anulado
            await tx.miscellaneousIncome.update({
                where: { id: income.id },
                data: { status: "VOIDED" }
            });

            // Marcar transacción original como anulada
            await tx.transaction.updateMany({
                where: { miscIncomeId: income.id },
                data: { status: "VOIDED" }
            });

            // Generar contra-asiento
            const adjustmentDescription = reason
                ? `Anulación de Ingreso #${income.id.slice(-6)} - Motivo: ${reason}`
                : `Anulación de Ingreso #${income.id.slice(-6)}`;
                
            await tx.transaction.create({
                data: {
                    instituteId: user.instituteId as string,
                    amount: -income.amount, // Negativo para compensar el ingreso original
                    type: "ADJUSTMENT",
                    method: income.method,
                    date: new Date(),
                    description: adjustmentDescription,
                    miscIncomeId: income.id,
                    operatorId: user.id
                }
            });
        });

        revalidatePath("/payments");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message || "Error al anular el ingreso" };
    }
}
