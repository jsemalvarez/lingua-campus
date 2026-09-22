import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { requireRole } from "@/lib/authz";
import { ArrowLeft, ArrowDownLeft } from "lucide-react";
import Link from "next/link";
import { ExpensesClient } from "./ExpensesClient";

export default async function ExpensesPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    // Sólo ADMIN, igual que cargar el gasto y que la liquidación de sueldos. En
    // el libro mayor de `/payments` la secretaría no ve egresos —lo definió el
    // instituto, ver SEC-03—, y esta pantalla no puede ser la puerta de atrás a
    // lo mismo.
    const user = await requireRole(["ADMIN"]);
    if (!user) redirect("/dashboard");

    const params = await searchParams;
    const now = new Date();

    const yearParam = typeof params?.year === "string" ? parseInt(params.year, 10) : NaN;
    const monthParam = typeof params?.month === "string" ? parseInt(params.month, 10) : NaN;

    const year = Number.isInteger(yearParam) ? yearParam : now.getFullYear();
    // `0` es "todo el año"; el estado inicial es el mes en curso, al revés que
    // Cuotas Eliminadas —que arranca sin filtro— porque acá hay gastos todos los
    // meses y la pregunta que trae al dueño es "qué gasté este mes". Ver FEAT-31.
    const month = Number.isInteger(monthParam) && monthParam >= 0 && monthParam <= 12
        ? monthParam
        : now.getMonth() + 1;

    // Los límites del período se arman en UTC y no en hora local a propósito. El
    // gasto con fecha cargada a mano se guarda como medianoche UTC
    // (`new Date("2026-09-01T00:00:00Z")` en `createExpenseAction`), así que un
    // límite en hora de Argentina —`new Date(2026, 8, 1)` es el 1° a las 03:00
    // UTC— dejaría afuera todo lo del primer día del mes. En Vercel no se nota
    // porque corre en UTC; en la máquina de desarrollo, sí.
    const from = month ? new Date(Date.UTC(year, month - 1, 1)) : new Date(Date.UTC(year, 0, 1));
    const to = month ? new Date(Date.UTC(year, month, 1)) : new Date(Date.UTC(year + 1, 0, 1));

    const category = typeof params?.category === "string" && params.category ? params.category : null;

    // Se consulta el libro mayor y no `Expense` porque es la misma fuente que la
    // tarjeta "Gastos Operativos" de `/payments`, y así los dos totales tienen
    // que dar igual. Un gasto sin asiento no está en la caja: en producción hay
    // dos de prueba de marzo que no lo tienen, y desde `Expense` esta pantalla
    // los sumaría y quedaría $499 arriba de la tarjeta. Ver FEAT-31.
    const movements = await prisma.transaction.findMany({
        where: {
            instituteId: user.instituteId,
            type: { in: ["EXPENSE", "PAYROLL"] },
            date: { gte: from, lt: to },
            ...(category ? { expense: { category } } : {})
        },
        include: { expense: { include: { recipient: { select: { name: true } } } } },
        orderBy: { date: "desc" }
    });

    // Las categorías del filtro salen de lo que hay cargado y no de las seis del
    // formulario: `Expense.category` es texto libre, los sueldos entran con
    // `Payroll` desde otras dos pantallas y en la base ya hay además `NOMINA`.
    // Se piden sólo las que tienen asiento, para que ninguna opción del selector
    // devuelva una lista vacía.
    const categoryRows = await prisma.expense.findMany({
        where: {
            instituteId: user.instituteId,
            transactions: { some: { type: { in: ["EXPENSE", "PAYROLL"] } } }
        },
        select: { category: true },
        distinct: ["category"],
        orderBy: { category: "asc" }
    });

    // Igual que en Cuotas Eliminadas: sin filtrar por estado, que a quien cargó
    // el gasto lo hayan dado de baja después no puede borrarlo del registro.
    const operators = await prisma.user.findMany({
        where: { instituteId: user.instituteId },
        select: { id: true, name: true }
    });
    const operatorMap = Object.fromEntries(operators.map((o) => [o.id, o.name]));

    const rows = movements.map((m) => ({
        id: m.id,
        date: m.date.toISOString(),
        category: m.expense?.category ?? "OTROS",
        description: m.expense?.description || m.description || "Sin concepto",
        recipientName: m.expense?.recipient?.name ?? null,
        ticketNumber: m.expense?.ticketNumber ?? null,
        amount: Math.abs(m.amount),
        status: m.status,
        operatorName: m.operatorId ? operatorMap[m.operatorId] ?? "Usuario desconocido" : "Sistema"
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
                        <ArrowDownLeft className="text-rose-600" size={28} />
                        Gastos
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Todo lo que salió de la caja, por período y por categoría. Los sueldos entran
                        acá: el total es el mismo que muestra «Gastos Operativos» en Finanzas.
                    </p>
                </header>

                <ExpensesClient
                    rows={rows}
                    year={year}
                    month={month}
                    category={category}
                    categories={categoryRows.map((c) => c.category)}
                />
            </main>
        </div>
    );
}
