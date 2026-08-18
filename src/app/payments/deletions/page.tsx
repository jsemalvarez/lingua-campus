import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { requireRole } from "@/lib/authz";
import { ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatFeeLabel } from "@/lib/utils";
import { DeletionsClient } from "./DeletionsClient";

export default async function FeeDeletionsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    // Sólo ADMIN, igual que la liquidación de sueldos. La secretaría borra —la
    // cuota es lo suyo, lo definió el instituto en SEC-03—, pero el seguimiento
    // es control del dueño. Y el link escondido no es un permiso: acá se entra
    // escribiendo la URL igual que a cualquier otra pantalla.
    const user = await requireRole(["ADMIN"]);
    if (!user) redirect("/dashboard");

    const params = await searchParams;
    const yearParam = typeof params?.year === "string" ? parseInt(params.year, 10) : NaN;
    const monthParam = typeof params?.month === "string" ? parseInt(params.month, 10) : NaN;

    const year = Number.isInteger(yearParam) ? yearParam : null;
    const month = year && Number.isInteger(monthParam) && monthParam >= 1 && monthParam <= 12 ? monthParam : null;

    // El período filtra por *cuándo se borró*, no por el período de la cuota: la
    // pregunta que contesta esta pantalla es "qué se dio de baja este mes".
    // Sin año elegido no hay filtro, y es el estado por omisión a propósito —
    // borrar una cuota es raro, y un mes vacío no se distingue de una pantalla
    // que no anduvo.
    let deletedAt: { gte: Date; lt: Date } | undefined;
    if (year) {
        const from = month ? new Date(year, month - 1, 1) : new Date(year, 0, 1);
        const to = month ? new Date(year, month, 1) : new Date(year + 1, 0, 1);
        deletedAt = { gte: from, lt: to };
    }

    const deletions = await prisma.feeDeletion.findMany({
        where: { instituteId: user.instituteId, ...(deletedAt ? { deletedAt } : {}) },
        orderBy: { deletedAt: "desc" },
    });

    // Los operadores se resuelven acá y no por relación: `FeeDeletion` no tiene
    // clave foránea a `User` a propósito (ver el modelo). Sin filtrar por estado:
    // que a quien borró lo hayan dado de baja después no puede borrarlo del
    // registro.
    const operators = await prisma.user.findMany({
        where: { instituteId: user.instituteId },
        select: { id: true, name: true },
    });
    const operatorMap = Object.fromEntries(operators.map((o) => [o.id, o.name]));

    const rows = deletions.map((d) => ({
        id: d.id,
        deletedAt: d.deletedAt.toISOString(),
        studentId: d.studentId,
        studentName: d.studentName,
        feeLabel: formatFeeLabel(d.type, d.month, d.year),
        courseName: d.courseName,
        amount: d.amount,
        reason: d.reason,
        operatorName: operatorMap[d.deletedById] ?? "Usuario desconocido",
    }));

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar currentActiveRole={user.activeRole} />

            <main className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="mb-8">
                    <Link
                        href="/payments"
                        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a Finanzas
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <Trash2 className="text-rose-600" size={28} />
                        Cuotas Eliminadas
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Las deudas que se dieron de baja, con quién las eliminó y por qué. La cuota ya no
                        existe: esto es la copia que quedó.
                    </p>
                </header>

                <DeletionsClient rows={rows} year={year} month={month} />
            </main>
        </div>
    );
}
