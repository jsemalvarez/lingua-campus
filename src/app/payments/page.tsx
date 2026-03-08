import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import dayjs from "dayjs";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Search, DollarSign, Wallet, Calendar, AlertCircle, TrendingUp, ArrowUpRight, ArrowDownLeft } from "lucide-react";

import { RegisterFeeForm } from "./components/RegisterFeeForm";
import { RegisterExpenseForm } from "./components/RegisterExpenseForm";

export default async function PaymentsPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, instituteId: true }
    });

    if (!user || user.role === "SUPERADMIN" || !user.instituteId) {
        redirect("/dashboard");
    }

    // 1. Conseguir Lista de estudiantes para el Selector del Cobro
    const students = await prisma.student.findMany({
        where: { instituteId: user.instituteId, status: "ACTIVE" },
        select: { id: true, name: true },
        orderBy: { name: "asc" }
    });

    // 2. Traer todos los Ingresos (Fees) de este instituto (históricos o del mes)
    const fees = await prisma.fee.findMany({
        where: { instituteId: user.instituteId },
        include: { student: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 15 // Limitamos los más recientes para la tabla
    });

    // 3. Traer Gastos (Expenses) de este instituto
    const expenses = await prisma.expense.findMany({
        where: { instituteId: user.instituteId },
        orderBy: { createdAt: "desc" },
        take: 10
    });

    // 4. Calcular KPIs Básicos
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const currentYear = new Date().getFullYear();

    // Ingresos del mes actual
    const currentMonthFees = fees.filter(f => f.month === currentMonth && f.year === currentYear && f.status === "PAID");
    const totalCollectedMsg = currentMonthFees.reduce((acc, curr) => acc + curr.amount, 0);

    // Gastos del mes actual
    const currentMonthExpenses = expenses.filter(e => e.date.getMonth() + 1 === currentMonth && e.date.getFullYear() === currentYear);
    const totalExpensesMsg = currentMonthExpenses.reduce((acc, curr) => acc + curr.amount, 0);

    // Rentabilidad (Ingresos - Gastos)
    const rentabilidad = totalCollectedMsg - totalExpensesMsg;

    const stats = [
        { label: "Cobrado este Mes", value: `$${totalCollectedMsg.toLocaleString()}`, icon: ArrowUpRight, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
        { label: "Rentabilidad (Neto)", value: rentabilidad >= 0 ? `+$${rentabilidad.toLocaleString()}` : `-$${Math.abs(rentabilidad).toLocaleString()}`, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/40" },
        { label: "Gastos Operativos", value: `$${totalExpensesMsg.toLocaleString()}`, icon: ArrowDownLeft, color: "text-rose-600", bg: "bg-rose-50 dark:bg-rose-950/40" },
    ];

    // Combinar Fees y Expenses para una sola "Línea de Vida/Movimientos" unificada (opcional, pero útil). Formateamos a un formato neutro.
    const allTransactions = [
        ...fees.map(f => ({
            id: `f-${f.id}`,
            date: f.datePaid || f.createdAt,
            title: `Cuota ${f.month}/${f.year} - ${f.student.name}`,
            amount: f.amount,
            type: "INCOME" as const,
            status: f.status,
            method: (f as any).method || "N/A"
        })),
        ...expenses.map(e => ({
            id: `e-${e.id}`,
            date: e.date,
            title: `${e.category}: ${e.description}`,
            amount: e.amount,
            type: "EXPENSE" as const,
            status: "PAID",
            method: "N/A"
        }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 20);

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />

            <main className="container mx-auto px-4 sm:px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Pagos y Finanzas</h1>
                        <p className="text-muted-foreground mt-1">
                            Controla los ingresos por cuotas y los egresos de tu instituto en tiempo real.
                        </p>
                    </div>
                </header>

                {/* Bloques Estadísticos (KPIs) */}
                <div className="grid gap-4 md:grid-cols-3 mb-8">
                    {stats.map((stat, i) => (
                        <Card key={i} className="p-6 border-border/40 hover:shadow-md transition-shadow">
                            <div className="flex flex-col gap-3">
                                <div className={`${stat.bg} ${stat.color} w-fit p-3 rounded-xl`}>
                                    <stat.icon size={24} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                    <h3 className="text-2xl font-bold mt-1 tracking-tight">{stat.value}</h3>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-3 items-start">
                    {/* Caja FUERTE Izquierda: Formularios para Agregar Dinero / Gastos */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="p-5 border-border/40 border-l-4 border-l-emerald-500 bg-emerald-500/5">
                            <RegisterFeeForm students={students} />
                        </Card>

                        <Card className="p-5 border-border/40 border-l-4 border-l-rose-500">
                            <RegisterExpenseForm />
                        </Card>
                    </div>

                    {/* CENTRO-DERECHA: El libro contable de vida */}
                    <div className="lg:col-span-2">
                        <Card className="overflow-hidden border-border/40">
                            <div className="p-6 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <h2 className="font-bold text-lg flex items-center gap-2">
                                    <Wallet className="text-primary" size={20} /> Movimientos Recientes
                                </h2>
                                <div className="relative w-full sm:max-w-xs">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                    <input
                                        type="text"
                                        placeholder="Filtrar movimientos..."
                                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none"
                                    />
                                </div>
                            </div>

                            {allTransactions.length === 0 ? (
                                <div className="p-12 text-center text-muted-foreground italic text-sm">
                                    Aún no hay movimientos contables registrados en la base de datos de tu instituto.
                                    Empieza cargando el pago de un alumno o un gasto operativo.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse whitespace-nowrap">
                                        <thead>
                                            <tr className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider font-semibold border-b border-border/50">
                                                <th className="px-5 py-4">Concepto / Referencia</th>
                                                <th className="px-5 py-4">Fecha</th>
                                                <th className="px-5 py-4 text-right">Monto</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {allTransactions.map((tx) => (
                                                <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`p-2 rounded-full ${tx.type === "INCOME" ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                                                                {tx.type === "INCOME" ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold text-sm max-w-[200px] truncate" title={tx.title}>
                                                                    {tx.title}
                                                                </span>
                                                                <div className="flex gap-2 text-xs font-medium mt-0.5">
                                                                    <span className={tx.type === "INCOME" ? "text-emerald-500" : "text-rose-500"}>
                                                                        {tx.type === "INCOME" ? "INGRESO" : "GASTO"}
                                                                    </span>
                                                                    {tx.status === "PENDING" && <span className="text-orange-500">· PENDIENTE</span>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-5 py-4 text-xs font-medium text-muted-foreground">
                                                        {dayjs(tx.date).format("DD MMM, YYYY")}
                                                    </td>
                                                    <td className="px-5 py-4 text-right">
                                                        <span className={`font-bold tabular-nums tracking-tight ${tx.type === "INCOME" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                                                            {tx.type === "INCOME" ? "+" : "-"}${tx.amount.toLocaleString()}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
