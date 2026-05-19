import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import dayjs from "dayjs";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { DollarSign, Wallet, Calendar, AlertCircle, TrendingUp, ArrowUpRight, ArrowDownLeft, Calculator, Sparkles, Percent, Coins } from "lucide-react";

import { RegisterIncomesForm } from "./components/RegisterIncomesForm";
import { RegisterOutgoingsForm } from "./components/RegisterOutgoingsForm";
import { TransactionTable } from "./components/TransactionTable";
import { GenerateFeesButton } from "./components/GenerateFeesButton";
import { CollectionChart } from "./components/CollectionChart";
import { getActiveRole } from "@/lib/roles";
import { formatFeeLabel } from "@/lib/utils";
import { DebtChart } from "./components/DebtChart";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Users, BookOpen } from "lucide-react";

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) redirect("/login");

    const sessionUser = session.user as any;
    const userRoles = sessionUser.roles || [sessionUser.role];
    const activeRole = await getActiveRole(userRoles);
    const isSecretary = activeRole === "SECRETARY";

    // Solo ADMIN, SECRETARY y SUPERADMIN (con instituto) pueden ver esta página administrativa
    const allowedRoles = ["ADMIN", "SECRETARY", "SUPERADMIN"];
    if (!allowedRoles.includes(activeRole)) {
        redirect("/dashboard");
    }

    const user = await prisma.user.findUnique({
        where: { id: (session.user as any).id },
        select: { id: true, role: true, instituteId: true }
    });

    if (!user || user.role === "SUPERADMIN" || !user.instituteId) {
        redirect("/dashboard");
    }

    // Pagination Variables
    const ITEMS_PER_PAGE = 20;
    const params = await searchParams;
    const currentPage = Number(params?.page) || 1;

    // 1. Conseguir Lista de estudiantes para el Selector del Cobro
    const students = await prisma.student.findMany({
        where: { instituteId: user.instituteId, status: "ACTIVE" },
        select: { id: true, name: true },
        orderBy: { name: "asc" }
    });

    // 2. Traer el Libro Mayor (Ledger) para la tabla histórica
    const ledger = await prisma.transaction.findMany({
        where: { instituteId: user.instituteId },
        include: {
            payment: { include: { fee: { include: { student: { select: { name: true } } } } } },
            expense: { include: { recipient: { select: { name: true } } } },
            miscIncome: { include: { student: { select: { name: true } } } }
        },
        orderBy: { date: "desc" }
    });

    // 3. Traer todos los Usuarios (para mapear Operadores) y Empleados (para sueldos)
    const allUsers = await prisma.user.findMany({
        where: { instituteId: user.instituteId, status: "ACTIVE" },
        select: { id: true, name: true, role: true, roles: true },
        orderBy: { name: "asc" }
    });

    const staffRoles = ["ADMIN", "TEACHER", "SECRETARY"];
    const employees = allUsers.filter(u =>
        staffRoles.includes(u.role) ||
        (u.roles && u.roles.some((r: string) => staffRoles.includes(r)))
    );

    // Mapeo rápido de operador
    const userMap = Object.fromEntries(allUsers.map(u => [u.id, u.name]));

    // 4. Calcular KPIs Básicos (Mes actual)
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    const monthlyFeesData = await prisma.fee.findMany({
        where: {
            instituteId: user.instituteId,
            month: currentMonth,
            year: currentYear
        },
        select: { originalAmount: true, paidAmount: true }
    });

    const totalToCollect = monthlyFeesData.reduce((acc: number, f: any) => acc + f.originalAmount, 0);
    const feesCollectedThisMonth = monthlyFeesData.reduce((acc: number, f: any) => acc + f.paidAmount, 0);

    // Filter ledger for current month stats
    const startOfMonth = dayjs().startOf('month').toDate();
    const endOfMonth = dayjs().endOf('month').toDate();

    const currentMonthTransactions = ledger.filter(t =>
        t.date >= startOfMonth &&
        t.date <= endOfMonth &&
        t.status === "VALID"
    );

    const feesIncome = currentMonthTransactions
        .filter(t => t.type === "PAYMENT")
        .reduce((acc, t) => acc + t.amount, 0);

    const miscIncome = currentMonthTransactions
        .filter(t => t.type === "MISC_INCOME")
        .reduce((acc, t) => acc + t.amount, 0);

    const totalCollected = feesIncome + miscIncome;

    const payrollExpenses = currentMonthTransactions
        .filter(t => t.type === "PAYROLL")
        .reduce((acc, t) => acc + Math.abs(t.amount), 0);

    const otherExpenses = currentMonthTransactions
        .filter(t => t.type === "EXPENSE")
        .reduce((acc, t) => acc + Math.abs(t.amount), 0);

    const totalExpenses = payrollExpenses + otherExpenses;

    const rentabilidad = totalCollected - totalExpenses;

    // 5. Calcular Descuentos e Intereses (Mes actual)
    const currentMonthPayments = currentMonthTransactions.filter(t => t.type === "PAYMENT");
    const totalDiscounts = currentMonthPayments.reduce((acc, t) => acc + (t.payment?.discount || 0), 0);
    const totalSurcharges = currentMonthPayments.reduce((acc, t) => acc + (t.payment?.surcharge || 0), 0);

    // Consultamos deudores totales (acumulado histórico)
    const totalDebtData = await prisma.fee.findMany({
        where: {
            instituteId: user.instituteId,
            status: { in: ["PENDING", "PARTIAL"] },
            originalAmount: { gt: 0 },
            OR: [
                { year: { lt: currentYear } },
                { year: currentYear, month: { lte: currentMonth } }
            ]
        },
        select: { originalAmount: true, paidAmount: true, month: true, year: true }
    });

    const historicalDebt = totalDebtData
        .filter(f => f.year < currentYear || (f.year === currentYear && f.month < currentMonth))
        .reduce((acc, f) => acc + (f.originalAmount - f.paidAmount), 0);

    const currentMonthDebt = totalDebtData
        .filter(f => f.year === currentYear && f.month === currentMonth)
        .reduce((acc, f) => acc + (f.originalAmount - f.paidAmount), 0);

    const totalDebt = historicalDebt + currentMonthDebt;

    const primaryStats = [
        {
            label: "Cobrado este Mes",
            value: `$${totalCollected.toLocaleString()}`,
            breakdown: [
                { key: "Cuotas y Matrículas", val: `$${feesIncome.toLocaleString()}` },
                { key: "Otros Ingresos", val: `$${miscIncome.toLocaleString()}` }
            ],
            icon: ArrowUpRight,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-950/40",
            borderColor: "border-blue-600/20 border-l-blue-600"
        },
        {
            label: "Rentabilidad (Neto)",
            value: rentabilidad >= 0 ? `+$${rentabilidad.toLocaleString()}` : `-$${Math.abs(rentabilidad).toLocaleString()}`,
            icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-50 dark:bg-emerald-950/40",
            borderColor: "border-emerald-600/20 border-l-emerald-600"
        },
        {
            label: "Gastos Operativos",
            value: `$${totalExpenses.toLocaleString()}`,
            breakdown: [
                { key: "Sueldos / Honorarios", val: `$${payrollExpenses.toLocaleString()}` },
                { key: "Gastos Generales", val: `$${otherExpenses.toLocaleString()}` }
            ],
            icon: ArrowDownLeft,
            color: "text-rose-600",
            bg: "bg-rose-50 dark:bg-rose-950/40",
            borderColor: "border-rose-600/20 border-l-rose-500"
        },
    ];

    const secondaryStats = [
        {
            label: "Progreso de Cobro (Mes)",
            value: `$${feesCollectedThisMonth.toLocaleString()} / $${totalToCollect.toLocaleString()}`,
            icon: Calculator,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-950/40",
            chartType: "COLLECTION",
            badgeText: "Gestión de Cobro",
            badgeColor: "text-blue-600 bg-blue-50 dark:bg-blue-950/40",
            borderColor: "border-blue-600/20 border-l-blue-600"
        },
        {
            label: "Deuda Total (Alumnos)",
            value: `$${totalDebt.toLocaleString()}`,
            icon: AlertCircle,
            color: "text-rose-600",
            bg: "bg-rose-50 dark:bg-rose-950/40",
            chartType: "DEBT",
            badgeText: "Estado de Mora",
            badgeColor: "text-rose-600 bg-rose-50 dark:bg-rose-950/40",
            borderColor: "border-rose-600/20 border-l-rose-600"
        },
    ];

    const adjustmentStats = [
        {
            label: "Intereses Cobrados (Mes)",
            value: `$${totalSurcharges.toLocaleString()}`,
            icon: Coins,
            color: "text-amber-600",
            bg: "bg-amber-50 dark:bg-amber-950/40",
            borderColor: "border-amber-600/20 border-l-amber-600",
            description: "Recargos por mora en cuotas"
        },
        {
            label: "Descuentos Otorgados (Mes)",
            value: `$${totalDiscounts.toLocaleString()}`,
            icon: Percent,
            color: "text-indigo-600",
            bg: "bg-indigo-50 dark:bg-indigo-950/40",
            borderColor: "border-indigo-600/20 border-l-indigo-600",
            description: "Bonificaciones y becas directas"
        }
    ];

    let filteredLedger = ledger;
    if (isSecretary) {
        filteredLedger = ledger.filter(t =>
            t.type !== "EXPENSE" &&
            t.type !== "PAYROLL" &&
            t.expenseId === null
        );
    }

    // Mapeo de títulos originales para transacciones anuladas
    const voidedTitlesMap = new Map<string, string>();
    ledger.filter(t => t.status === "VOIDED").forEach(t => {
        const oid = t.paymentId || t.expenseId || t.miscIncomeId;
        if (!oid) return;

        let vTitle = t.description || "";
        if (t.type === "PAYMENT" && t.payment?.fee?.student) {
            const fee = t.payment.fee;
            vTitle = `${formatFeeLabel(fee.type, fee.month, fee.year)} - ${fee.student.name}`;
        } else if ((t.type === "EXPENSE" || t.type === "PAYROLL") && t.expense) {
            vTitle = t.type === "PAYROLL" && t.expense.recipient?.name
                ? `Sueldo: ${t.expense.recipient.name}`
                : `${t.expense.category}: ${t.expense.description}`;
        } else if (t.type === "MISC_INCOME" && t.miscIncome) {
            vTitle = t.miscIncome.student ? `${t.miscIncome.category} - ${t.miscIncome.student.name}` : t.miscIncome.description;
        }
        voidedTitlesMap.set(oid, vTitle);
    });

    // Combinar y Sortear desde el Ledger
    const allTransactionsRaw = filteredLedger.map(t => {
        let title = t.description || "";
        let note = null;
        let recipientName = null;
        let ticketNumber = null;
        let entityId = t.paymentId || t.expenseId || t.miscIncomeId;
        let originalId = entityId || t.id;

        // Extraer motivo de anulación si existe
        if (title.includes(" - Motivo: ")) {
            const parts = title.split(" - Motivo: ");
            title = parts[0];
            note = parts[1];
        }

        if (t.type === "PAYMENT" && t.payment?.fee?.student) {
            const fee = t.payment.fee;
            let feeLabel = formatFeeLabel(fee.type, fee.month, fee.year);

            title = `${feeLabel} - ${fee.student.name}`;
            if (t.payment.notes) {
                note = t.payment.notes;
            }
        } else if (t.type === "EXPENSE" && t.expense) {
            title = `${t.expense.category}: ${t.expense.description}`;
            recipientName = t.expense.recipient?.name || null;
            ticketNumber = t.expense.ticketNumber || null;
        } else if (t.type === "PAYROLL" && t.expense) {
            title = t.expense.recipient?.name ? `Sueldo: ${t.expense.recipient.name}` : `Pago de Salario`;
            note = t.expense.description; // Aquí asignamos el concepto del sueldo a la nota
            recipientName = t.expense.recipient?.name || null;
            ticketNumber = t.expense.ticketNumber || null;
        } else if (t.type === "MISC_INCOME" && t.miscIncome) {
            const mi = t.miscIncome;
            if (mi.category === "ADELANTO") {
                title = mi.student ? `Adelanto - ${mi.student.name}` : `Adelanto de Pago`;
                note = mi.description;
            } else {
                title = mi.student ? `${mi.category}: ${mi.description} - ${mi.student.name}` : `${mi.category}: ${mi.description}`;
            }
            ticketNumber = mi.ticketNumber || null;
        }

        const relatedTitle = (t.type === "ADJUSTMENT" || t.type === "REFUND") ? voidedTitlesMap.get(entityId || "") : null;

        return {
            id: t.id,
            originalId,
            date: t.date,
            title,
            note,
            recipientName,
            ticketNumber,
            amount: Math.abs(t.amount),
            type: t.amount >= 0 ? "INCOME" as const : "EXPENSE" as const,
            status: t.status,
            method: t.method,
            category: t.type,
            operatorName: t.operatorId ? userMap[t.operatorId] : "Sistema",
            relatedTitle
        };
    }).filter(t => t.amount > 0);

    const totalTransactions = allTransactionsRaw.length;
    const totalPages = Math.ceil(totalTransactions / ITEMS_PER_PAGE);

    // Slice para la página actual
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const allTransactions = allTransactionsRaw.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />

            <main className="container mx-auto px-4 sm:px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Finanzas</h1>
                        <p className="text-muted-foreground mt-1">
                            Controla los ingresos por cuotas y los egresos de tu instituto en tiempo real.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Link href="/dashboard/help#pagos">
                            <Button variant="secondary" className="flex items-center gap-2 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 shadow-sm border border-emerald-500/20 font-bold">
                                <BookOpen size={16} className="text-emerald-500" />
                                Manual de Uso
                            </Button>
                        </Link>
                        <Link href="/payments/debtors">
                            <Button variant="outline" className="flex items-center gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-50">
                                <AlertCircle size={16} />
                                Ver Deudores
                            </Button>
                        </Link>
                        {!isSecretary && (
                            <Link href="/payments/payroll">
                                <Button variant="outline" className="flex items-center gap-2 border-indigo-500/30 text-indigo-600 hover:bg-indigo-50">
                                    <DollarSign size={16} />
                                    Pago de Sueldos
                                </Button>
                            </Link>
                        )}
                        {!isSecretary && <GenerateFeesButton />}

                    </div>
                </header>

                {/* Bloques Estadísticos (KPIs) - Row 1 */}
                {!isSecretary && (
                    <div className="grid gap-4 md:grid-cols-3 mb-6 items-stretch">
                        {primaryStats.map((stat: any, i) => (
                            <Card key={i} className={`p-6 bg-gradient-to-r from-blue-900/40 to-sky-100/40 dark:from-sky-950/40 dark:to-sky-400/40 shadow-[0_0_50px_rgba(255,255,255,0.7)] dark:shadow-xl dark:shadow-sky-400/60 border-l-4 flex flex-col justify-between ${stat.borderColor}`}>
                                <div className="flex flex-col gap-3">
                                    <div className={`${stat.bg} ${stat.color} w-fit p-3 rounded-xl`}>
                                        <stat.icon size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                        <h3 className="text-2xl font-bold mt-1 tracking-tight">{stat.value}</h3>
                                    </div>
                                </div>
                                {stat.breakdown && (
                                    <div className="mt-4 pt-3 border-t border-border/40 space-y-1.5">
                                        {stat.breakdown.map((item: any, idx: number) => (
                                            <div key={idx} className="flex justify-between items-center text-xs">
                                                <span className="text-muted-foreground">{item.key}</span>
                                                <span className="font-semibold text-foreground/80">{item.val}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                )}

                {/* Bloques Estadísticos (KPIs) - Row 2 (Charts & Health) */}
                {!isSecretary && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 mb-6">
                        {secondaryStats.map((stat: any, i) => (
                            <Card key={i} className={`p-6 bg-gradient-to-r from-blue-900/40 to-sky-100/40 dark:from-sky-950/40 dark:to-sky-400/40 shadow-[0_0_50px_rgba(255,255,255,0.7)] dark:shadow-xl dark:shadow-sky-400/60 border-l-4 ${stat.borderColor}`}>
                                <div className="h-full flex flex-col justify-between gap-4">
                                    <div className="flex items-center justify-between">
                                        <div className={`${stat.bg} ${stat.color} p-2.5 rounded-xl`}>
                                            <stat.icon size={20} />
                                        </div>
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${stat.badgeColor}`}>{stat.badgeText}</span>
                                    </div>

                                    <div className="flex justify-between items-end gap-4">
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>

                                            {stat.chartType === "COLLECTION" ? (
                                                <div className="mt-2 flex items-stretch font-bold tracking-tight h-8 sm:h-9 select-none text-[10px] sm:text-lg">
                                                    <div className="flex items-center px-2 sm:px-3 border border-blue-600/50 rounded-l-lg text-emerald-600 bg-transparent">
                                                        ${feesCollectedThisMonth.toLocaleString()}
                                                    </div>
                                                    <div className="flex items-center justify-center px-2 bg-muted border-y border-blue-600/50 sm:text-xs text-muted-foreground font-medium">
                                                        +
                                                    </div>
                                                    <div className="flex items-center px-2 sm:px-3 border border-blue-600/50 text-amber-500 bg-transparent">
                                                        ${Math.max(0, totalToCollect - feesCollectedThisMonth).toLocaleString()}
                                                    </div>
                                                    <div className="flex items-center justify-center px-2 bg-muted border-y border-blue-600/50 sm:text-xs text-muted-foreground font-medium">
                                                        =
                                                    </div>
                                                    <div className="flex items-center px-3 sm:px-4 bg-blue-600 text-white rounded-r-lg shadow-sm">
                                                        ${totalToCollect.toLocaleString()}
                                                    </div>
                                                </div>
                                            ) : stat.chartType === "DEBT" ? (
                                                <div className="mt-2 flex items-stretch font-bold tracking-tight h-8 sm:h-9 select-none text-[10px] sm:text-lg">
                                                    <div className="flex items-center px-2 sm:px-3 border border-rose-500 rounded-l-lg text-rose-600 bg-transparent">
                                                        ${historicalDebt.toLocaleString()}
                                                    </div>
                                                    <div className="flex items-center justify-center px-2 bg-muted border-y border-rose-500 sm:text-xs text-muted-foreground font-medium">
                                                        +
                                                    </div>
                                                    <div className="flex items-center px-2 sm:px-3 border border-rose-500 text-amber-500 bg-transparent">
                                                        ${currentMonthDebt.toLocaleString()}
                                                    </div>
                                                    <div className="flex items-center justify-center px-2 bg-muted border-y border-rose-500 sm:text-xs text-muted-foreground font-medium">
                                                        =
                                                    </div>
                                                    <div className="flex items-center px-3 sm:px-4 bg-rose-600 text-white rounded-r-lg shadow-sm">
                                                        ${totalDebt.toLocaleString()}
                                                    </div>
                                                </div>
                                            ) : (
                                                <h3 className={`text-xl font-bold mt-1 tracking-tight ${stat.color}`}>{stat.value}</h3>
                                            )}
                                        </div>

                                        {stat.chartType === "COLLECTION" && (
                                            <div className="w-1/4">
                                                <CollectionChart
                                                    totalToCollect={totalToCollect}
                                                    totalCollected={feesCollectedThisMonth}
                                                />
                                            </div>
                                        )}

                                        {stat.chartType === "DEBT" && (
                                            <div className="w-1/4">
                                                <DebtChart
                                                    historicalDebt={historicalDebt}
                                                    currentMonthDebt={currentMonthDebt}
                                                />
                                            </div>
                                        )}

                                        {!stat.chartType && (
                                            <Link href="/payments/debtors">
                                                <Button variant="ghost" size="sm" className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50">
                                                    Ver Detalle
                                                </Button>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Bloques Estadísticos (KPIs) - Row 3 (Adjustments) */}
                {!isSecretary && (
                    <div className="grid gap-4 md:grid-cols-2 mb-8">
                        {adjustmentStats.map((stat: any, i) => (
                            <Card key={i} className={`p-5 bg-gradient-to-r from-blue-900/40 to-sky-100/40 dark:from-sky-950/40 dark:to-sky-400/40 shadow-[0_0_50px_rgba(255,255,255,0.7)] dark:shadow-xl dark:shadow-sky-400/60 border-l-4 ${stat.borderColor}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`${stat.bg} ${stat.color} p-3 rounded-xl`}>
                                        <stat.icon size={22} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                                        <h3 className="text-2xl font-bold mt-0.5 tracking-tight">{stat.value}</h3>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">{stat.description}</p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                <div className="grid gap-6 lg:grid-cols-3 items-start">
                    {/* Caja FUERTE Izquierda: Formularios para Agregar Dinero / Gastos */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="p-5 bg-gradient-to-r from-blue-900/40 to-sky-100/40 dark:from-sky-950/40 dark:to-sky-400/40 shadow-[0_0_50px_rgba(255,255,255,0.7)] dark:shadow-xl dark:shadow-sky-400/60 border-emerald-500/20 border-l-4 border-l-emerald-500">
                            <RegisterIncomesForm students={students} />
                        </Card>

                        {!isSecretary && (
                            <Card className="p-5 bg-gradient-to-r from-blue-900/40 to-sky-100/40 dark:from-sky-950/40 dark:to-sky-400/40 shadow-[0_0_50px_rgba(255,255,255,0.7)] dark:shadow-xl dark:shadow-sky-400/60 border-rose-500/20 border-l-4 border-l-rose-500">
                                <RegisterOutgoingsForm employees={employees} />
                            </Card>
                        )}
                    </div>

                    {/* CENTRO-DERECHA: El libro contable de vida (Buscador y Tabla) */}
                    <TransactionTable
                        transactions={allTransactions}
                        totalPages={totalPages}
                        currentPage={currentPage}
                    />
                </div>
            </main>
        </div>
    );
}
