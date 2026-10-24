import { redirect } from "next/navigation";
import { INSTITUTE_ADMINS, requireRole } from "@/lib/authz";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { DollarSign, Wallet, Calendar, AlertCircle, TrendingUp, ArrowUpRight, ArrowDownLeft, Calculator, Sparkles, Percent, Coins, Trash2 } from "lucide-react";

import { RegisterIncomesForm } from "./components/RegisterIncomesForm";
import { RegisterOutgoingsForm } from "./components/RegisterOutgoingsForm";
import { TransactionTable } from "./components/TransactionTable";
import { GenerateFeesButton } from "./components/GenerateFeesButton";
import { CollectionChart } from "./components/CollectionChart";
import { formatFeeLabel } from "@/lib/utils";
import { excludeNotYetDueFees } from "@/lib/feeDue";
import { instituteMonth, monthDays } from "@/lib/dates";
import { DebtChart } from "./components/DebtChart";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Users, BookOpen } from "lucide-react";
import { MonthYearSelector } from "./components/MonthYearSelector";

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    // Solo ADMIN y SECRETARY pueden ver esta página administrativa
    const user = await requireRole(INSTITUTE_ADMINS);
    if (!user) redirect("/dashboard");

    const activeRole = user.activeRole;
    const isSecretary = activeRole === "SECRETARY";

    // Pagination Variables
    const ITEMS_PER_PAGE = 20;
    const params = await searchParams;
    const currentPage = Number(params?.page) || 1;
    const searchQuery = typeof params?.search === 'string' ? params.search : "";

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
            payment: {
                include: {
                    fee: {
                        include: {
                            student: { select: { name: true } },
                            // El curso distingue dos cuotas del mismo mes de un alumno con dos inscripciones (FIN-33).
                            enrollment: { select: { course: { select: { name: true } } } }
                        }
                    }
                }
            },
            expense: { include: { recipient: { select: { name: true } } } },
            miscIncome: { include: { student: { select: { name: true } } } }
        },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }]
    });

    // 3. Traer todos los Usuarios (para mapear Operadores) y Empleados (para sueldos)
    const allUsers = await prisma.user.findMany({
        where: { instituteId: user.instituteId, status: "ACTIVE" },
        select: { id: true, name: true, roles: true },
        orderBy: { name: "asc" }
    });

    const staffRoles: string[] = ["ADMIN", "TEACHER", "SECRETARY"];
    const employees = allUsers.filter(u => u.roles.some(r => staffRoles.includes(r)));
    
    // Mapeo rápido de operador
    const userMap = Object.fromEntries(allUsers.map(u => [u.id, u.name]));

    // 4. Calcular KPIs Básicos (Mes seleccionado)
    const currentMonth = params?.month ? parseInt(params.month as string, 10) : instituteMonth().month;
    const currentYear = params?.year ? parseInt(params.year as string, 10) : instituteMonth().year;

    const monthlyFeesData = await prisma.fee.findMany({
        where: {
            instituteId: user.instituteId,
            month: currentMonth,
            year: currentYear,
            // La anulada no es plata a cobrar: sin esto inflaba el total del mes (FIN-33).
            status: { not: "CANCELLED" }
        },
        select: { originalAmount: true, paidAmount: true }
    });

    const totalToCollect = monthlyFeesData.reduce((acc: number, f: any) => acc + f.originalAmount, 0);
    const feesCollectedThisMonth = monthlyFeesData.reduce((acc: number, f: any) => acc + f.paidAmount, 0);

    // Filter ledger for current month stats
    // `Transaction.date` es el día contable (FIN-34), así que el mes son sus días.
    // Antes se cortaba con la zona del servidor, y en local y en Vercel el mismo
    // mes sumaba distinto.
    const { first: startOfMonth, next: startOfNextMonth } = monthDays({ year: currentYear, month: currentMonth });

    const currentMonthTransactions = ledger.filter(t =>
        t.date >= startOfMonth &&
        t.date < startOfNextMonth &&
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
            ],
            // El derecho de examen vence con el examen, no con el mes 0.
            ...excludeNotYetDueFees()
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

    const monthsSpanish = [
        "", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const monthLabel = monthsSpanish[currentMonth];

    const primaryStats = [
        {
            label: `Cobrado en ${monthLabel}`,
            value: `$${totalCollected.toLocaleString()}`,
            breakdown: [
                { key: "Cuotas y Matrículas", val: `$${feesIncome.toLocaleString()}` },
                { key: "Otros Ingresos", val: `$${miscIncome.toLocaleString()}` }
            ],
            icon: ArrowUpRight,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-950/40",
            borderColor: "border-l-blue-600"
        },
        {
            label: `Rentabilidad (Neto - ${monthLabel})`,
            value: rentabilidad >= 0 ? `+$${rentabilidad.toLocaleString()}` : `-$${Math.abs(rentabilidad).toLocaleString()}`,
            icon: TrendingUp,
            color: "text-emerald-600",
            bg: "bg-emerald-50 dark:bg-emerald-950/40",
            borderColor: "border-l-emerald-600"
        },
        {
            label: `Gastos Operativos (${monthLabel})`,
            value: `$${totalExpenses.toLocaleString()}`,
            breakdown: [
                { key: "Sueldos / Honorarios", val: `$${payrollExpenses.toLocaleString()}` },
                { key: "Gastos Generales", val: `$${otherExpenses.toLocaleString()}` }
            ],
            icon: ArrowDownLeft,
            color: "text-rose-600",
            bg: "bg-rose-50 dark:bg-rose-950/40",
            borderColor: "border-l-rose-500"
        },
    ];

    const secondaryStats = [
        {
            label: `Progreso de Cobro (${monthLabel})`,
            value: `$${feesCollectedThisMonth.toLocaleString()} / $${totalToCollect.toLocaleString()}`,
            icon: Calculator,
            color: "text-blue-600",
            bg: "bg-blue-50 dark:bg-blue-950/40",
            chartType: "COLLECTION",
            badgeText: "Gestión de Cobro",
            badgeColor: "text-blue-600 bg-blue-50 dark:bg-blue-950/40",
            borderColor: "border-l-blue-600"
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
            borderColor: "border-l-rose-600"
        },
    ];

    const adjustmentStats = [
        {
            label: `Intereses Cobrados (${monthLabel})`,
            value: `$${totalSurcharges.toLocaleString()}`,
            icon: Coins,
            color: "text-amber-600",
            bg: "bg-amber-50 dark:bg-amber-950/40",
            borderColor: "border-l-amber-600",
            description: `Recargos por mora en cuotas de ${monthLabel}`
        },
        {
            label: `Descuentos Otorgados (${monthLabel})`,
            value: `$${totalDiscounts.toLocaleString()}`,
            icon: Percent,
            color: "text-indigo-600",
            bg: "bg-indigo-50 dark:bg-indigo-950/40",
            borderColor: "border-l-indigo-600",
            description: `Bonificaciones y becas directas de ${monthLabel}`
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

    // Qué muestra cada fila de Movimientos, por partes: el concepto, a quién
    // corresponde y dónde. Antes era un solo título —«Cuota Octubre 2026 - Paz…»—
    // sin el curso, y dos cobros del mismo mes en dos inscripciones del mismo alumno
    // se leían idénticos (FIN-33). El contra-asiento de una anulación lleva el
    // pago, el gasto o el ingreso que anula, así que se describe con sus datos:
    // «ANULACIÓN · Matrícula 2026», con el alumno y el curso debajo.
    const describeMovement = (t: (typeof ledger)[number]) => {
        const fee = t.payment?.fee;
        if (fee?.student) {
            return {
                concept: formatFeeLabel(fee.type, fee.month, fee.year),
                who: fee.student.name as string | null,
                where: fee.enrollment?.course.name ?? null
            };
        }
        const expense = t.expense;
        if (expense) {
            // Los sueldos se cargan como gasto de categoría "Payroll" (createExpenseAction).
            if (expense.category === "Payroll") {
                return { concept: expense.description || "Pago de sueldo", who: expense.recipient?.name ?? null, where: null };
            }
            const recipient = expense.recipient?.name ?? null;
            return { concept: expense.description, who: recipient ?? expense.category, where: recipient ? expense.category : null };
        }
        const income = t.miscIncome;
        if (income) {
            if (income.category === "ADELANTO") {
                return { concept: "Adelanto de pago", who: income.student?.name ?? null, where: null };
            }
            return { concept: income.description, who: income.student?.name ?? null, where: income.category as string | null };
        }
        return { concept: (t.description || "").split(" - Motivo: ")[0], who: null, where: null };
    };

    // Combinar y Sortear desde el Ledger
    const allTransactionsRaw = filteredLedger.map(t => {
        // La aplicación de saldo a favor se asienta en $0 —la plata entró antes,
        // cuando se cobró de más— pero es el único movimiento en $0 sobre el que
        // hay algo que hacer: mientras exista, el pago original no se puede
        // anular. Se muestra por eso, y se reconoce por estructura y no por el
        // texto de la descripción. Los otros dos ajustes en $0 quedan afuera: la
        // cuota borrada de SEC-03 no tiene pago asociado, y el contra-asiento de
        // anular una aplicación comparte pago, tipo e importe con el original —se
        // distinguen porque al anular, el original queda VOIDED y el
        // contra-asiento nace VALID—. No se muestra el contra-asiento: el
        // original tachado ya dice que se anuló, y no hubo plata de por medio.
        // Ver FIN-11.
        const isCreditApplication =
            t.type === "ADJUSTMENT" &&
            t.payment?.method === "SALDO" &&
            !(t.payment?.status === "VOIDED" && t.status === "VALID");
        // El descuento del 100% también se asienta en $0 —no entró plata— y también
        // se muestra: es la única huella en la caja de quién perdonó la cuota, y desde
        // acá se anula. Su contra-asiento es un ADJUSTMENT y queda afuera. FIN-32.
        const isFullDiscount = t.type === "PAYMENT" && t.amount === 0 && (t.payment?.discount ?? 0) > 0;

        const entityId = t.paymentId || t.expenseId || t.miscIncomeId;
        const originalId = entityId || t.id;
        const { concept, who, where } = describeMovement(t);

        // La nota: el motivo de una anulación, la que se escribió al cobrar, o el
        // detalle de un adelanto. Se ve con el ícono de la fila, no en el texto.
        const reason = (t.description || "").split(" - Motivo: ")[1];
        const note = reason
            ?? (t.type === "PAYMENT" ? t.payment?.notes || null : null)
            ?? (t.type === "MISC_INCOME" && t.miscIncome?.category === "ADELANTO" ? t.miscIncome.description || null : null);

        return {
            id: t.id,
            originalId,
            date: t.date,
            concept,
            who,
            where,
            // Todo junto, para el buscador y para el cartel de anular: ahí también
            // tienen que poder distinguirse dos cobros del mismo mes.
            title: [concept, who, where].filter(Boolean).join(" - "),
            note,
            recipientName: t.expense?.recipient?.name ?? null,
            ticketNumber: t.expense?.ticketNumber || t.miscIncome?.ticketNumber || null,
            // En la aplicación de saldo el asiento vale $0, pero el importe que se
            // usó es el del pago. Se muestra sin signo y etiquetado aparte: no es
            // plata que entró ni salió, y la tabla es la caja.
            amount: isCreditApplication ? (t.payment?.amount ?? 0)
                : isFullDiscount ? (t.payment?.discount ?? 0)
                : Math.abs(t.amount),
            isCreditApplication,
            isFullDiscount,
            type: t.amount >= 0 ? "INCOME" as const : "EXPENSE" as const,
            status: t.status,
            method: t.method,
            category: t.type,
            operatorName: t.operatorId ? userMap[t.operatorId] : "Sistema"
        };
    }).filter(t => t.amount > 0 || t.isCreditApplication);

    const normalizeString = (str: string) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    let filteredTransactions = allTransactionsRaw;
    if (searchQuery) {
        const query = normalizeString(searchQuery);
        filteredTransactions = allTransactionsRaw.filter((tx) => {
            const title = normalizeString(tx.title || "");
            const note = normalizeString(tx.note || "");
            const ticket = normalizeString(tx.ticketNumber || "");
            const operator = normalizeString(tx.operatorName || "");
            const recipient = normalizeString(tx.recipientName || "");
            
            return (
                title.includes(query) ||
                note.includes(query) ||
                ticket.includes(query) ||
                operator.includes(query) ||
                recipient.includes(query)
            );
        });
    }

    const totalTransactions = filteredTransactions.length;
    const totalPages = Math.ceil(totalTransactions / ITEMS_PER_PAGE);
    
    // Slice para la página actual
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const allTransactions = filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar currentActiveRole={user.activeRole} />

            <main className="container mx-auto px-4 sm:px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Finanzas</h1>
                        <p className="text-muted-foreground mt-1">
                            Controla los ingresos por cuotas y los egresos de tu instituto en tiempo real.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Link href="/payments/debtors">
                            <Button variant="outline" className="flex items-center gap-2 border-amber-500/30 text-amber-600 hover:bg-amber-50">
                                <AlertCircle size={16} />
                                Ver Deudores
                            </Button>
                        </Link>
                        {/* El detalle de lo que sale, que en esta tabla queda repartido
                            entre los cobros. La secretaría no ve egresos (SEC-03), así
                            que tampoco ve el acceso. Ver FEAT-31. */}
                        {!isSecretary && (
                            <Link href="/payments/expenses">
                                <Button variant="outline" className="flex items-center gap-2 border-rose-500/30 text-rose-600 hover:bg-rose-50">
                                    <ArrowDownLeft size={16} />
                                    Ver Gastos
                                </Button>
                            </Link>
                        )}
                        {!isSecretary && (
                            <Link href="/payments/payroll">
                                <Button variant="outline" className="flex items-center gap-2 border-indigo-500/30 text-indigo-600 hover:bg-indigo-50">
                                    <DollarSign size={16} />
                                    Pago de Sueldos
                                </Button>
                            </Link>
                        )}
                        {/* Seguimiento de lo que la secretaría dio de baja: es control
                            del dueño, así que el acceso no se le muestra a ella. La
                            pantalla lo verifica por su cuenta con `requireRole`. */}
                        {!isSecretary && (
                            <Link href="/payments/deletions">
                                <Button variant="outline" className="flex items-center gap-2 border-rose-500/30 text-rose-600 hover:bg-rose-50">
                                    <Trash2 size={16} />
                                    Cuotas Eliminadas
                                </Button>
                            </Link>
                        )}
                        {!isSecretary && <GenerateFeesButton />}

                    </div>
                </header>

                {/* Selector de Fecha */}
                {!isSecretary && (
                    <div className="flex justify-end mb-4">
                        <MonthYearSelector currentMonth={currentMonth} currentYear={currentYear} />
                    </div>
                )}

                {/* Bloques Estadísticos (KPIs) - Row 1 */}
                {!isSecretary && (
                    <div className="grid gap-4 md:grid-cols-3 mb-6 items-stretch">
                        {primaryStats.map((stat: any, i) => (
                            <Card key={i} className={`p-6 border-border/40 hover:shadow-md transition-shadow border-l-4 flex flex-col justify-between ${stat.borderColor}`}>
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

                {/* Bloques Estadísticos (KPIs) - Row 2 (Adjustments) */}
                {!isSecretary && (
                    <div className="grid gap-4 md:grid-cols-2 mb-6">
                        {adjustmentStats.map((stat: any, i) => (
                            <Card key={i} className={`p-5 border-border/40 hover:shadow-md transition-shadow border-l-4 ${stat.borderColor}`}>
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

                {/* Bloques Estadísticos (KPIs) - Row 3 (Charts & Health) */}
                {!isSecretary && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 mb-8">
                        {secondaryStats.map((stat: any, i) => (
                            <Card key={i} className={`p-6 border-border/40 hover:shadow-md transition-shadow border-l-4 ${stat.borderColor}`}>
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

                <div className="grid gap-6 lg:grid-cols-3 items-start">
                    {/* Caja FUERTE Izquierda: Formularios para Agregar Dinero / Gastos */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="p-5 border-border/40 border-l-4 border-l-emerald-500 bg-emerald-500/5">
                            <RegisterIncomesForm students={students} />
                        </Card>

                        {!isSecretary && (
                            <Card className="p-5 border-border/40 border-l-4 border-l-rose-500 bg-rose-500/5">
                                <RegisterOutgoingsForm employees={employees} />
                            </Card>
                        )}
                    </div>

                    {/* CENTRO-DERECHA: El libro contable de vida (Buscador y Tabla) */}
                    <TransactionTable 
                        transactions={allTransactions} 
                        totalPages={totalPages}
                        currentPage={currentPage}
                        searchQuery={searchQuery}
                    />
                </div>
            </main>
        </div>
    );
}
