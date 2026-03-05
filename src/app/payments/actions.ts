"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
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

    const amountStr = formData.get("amount") as string;
    const method = formData.get("method") as string;
    const status = formData.get("status") as string;
    const enrollmentId = formData.get("enrollmentId") as string; // Opcional
    const studentId = formData.get("studentId") as string; // Opcional
    const notes = formData.get("notes") as string;

    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount <= 0) {
        return { success: false, error: "El monto debe ser numérico y mayor a 0" };
    }

    try {
        const currentDate = new Date();
        await prisma.fee.create({
            data: {
                studentId: studentId,
                amount,
                year: currentDate.getFullYear(),
                month: currentDate.getMonth() + 1, // 1-12
                status: status === "PAID" ? "PAID" : "PENDING",
                datePaid: status === "PAID" ? currentDate : null,
                instituteId: user.instituteId as string
            }
        });

        revalidatePath("/payments");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Error al registrar pago" };
    }
}

export async function createExpenseAction(formData: FormData) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    const description = formData.get("description") as string;
    const amountStr = formData.get("amount") as string;
    const category = formData.get("category") as string;
    const dateStr = formData.get("date") as string;

    const amount = parseFloat(amountStr);

    if (!description || isNaN(amount) || amount <= 0) {
        return { success: false, error: "Descripción y un monto mayor a 0 son obligatorios" };
    }

    try {
        await prisma.expense.create({
            data: {
                description: description.trim(),
                amount,
                category: category || "OTROS",
                date: dateStr ? new Date(dateStr) : new Date(),
                instituteId: user.instituteId as string
            }
        });

        revalidatePath("/payments");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Error al cargar gasto operativo" };
    }
}
