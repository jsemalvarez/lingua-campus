import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import dayjs from "dayjs";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { DollarSign, Wallet, Calendar, AlertCircle, TrendingUp, ArrowUpRight, ArrowDownLeft } from "lucide-react";

import { RegisterFeeForm } from "./components/RegisterFeeForm";
import { RegisterExpenseForm } from "./components/RegisterExpenseForm";
import { RegisterSalaryForm } from "./components/RegisterSalaryForm";
import { TransactionTable } from "./components/TransactionTable";

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
        include: { recipient: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 15
    });

    // 4. Traer Empleados para el formulario de sueldos
    const employees = await prisma.user.findMany({
        where: {
            instituteId: user.instituteId,
            status: "ACTIVE",
            role: { in: ["ADMIN", "TEACHER"] }
        },
        select: { id: true, name: true, role: true },
        orderBy: { name: "asc" }
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
            originalId: e.id,
            date: e.date,
            title: e.recipient ? `Sueldo: ${e.recipient.name}` : `${e.category}: ${e.description}`,
            recipientName: e.recipient?.name || null,
            ticketNumber: (e as any).ticketNumber || null,
            amount: e.amount,
            category: e.category,
            description: e.description,
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
                        <Card className="p-5 border-border/40 border-l-4 border-l-amber-500 bg-amber-500/5">
                            <RegisterSalaryForm employees={employees} />
                        </Card>

                        <Card className="p-5 border-border/40 border-l-4 border-l-rose-500 bg-rose-500/5">
                            <RegisterExpenseForm />
                        </Card>
                    </div>

                    {/* CENTRO-DERECHA: El libro contable de vida (Buscador y Tabla) */}
                    <TransactionTable transactions={allTransactions} />
                </div>                
            </main>
        </div>
    );
}
