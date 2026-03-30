import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { AlertTriangle, Phone, Calendar, User, Clock, AlertCircle } from "lucide-react";
import { getDebtorsReportAction } from "../billingActions";
import { PendingFeeActions } from "./PendingFeeActions";

export default async function DebtorsPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) redirect("/login");

    const result = await getDebtorsReportAction();
    if (!result.success || !result.data) {
        return <div className="p-10 text-center">Error al cargar deudores.</div>;
    }

    const debtors = result.data;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Agrupar por estudiante para totales
    const summary = debtors.reduce((acc: any, fee) => {
        const sid = fee.studentId;
        const isCurrent = fee.month === currentMonth && fee.year === currentYear;
        const owed = (fee.originalAmount - fee.paidAmount);

        if (!acc[sid]) {
            acc[sid] = {
                name: fee.student.name,
                phone: fee.student.phone,
                totalOwed: 0,
                currentMonthOwed: 0,
                previousMonthsOwed: 0,
                months: []
            };
        }
        
        acc[sid].totalOwed += owed;
        if (isCurrent) {
            acc[sid].currentMonthOwed += owed;
        } else {
            acc[sid].previousMonthsOwed += owed;
        }

        acc[sid].months.push({
            feeId: fee.id,
            label: `${fee.month}/${fee.year} (${fee.enrollment?.course.name || 'Matrícula'})`,
            isCurrent,
            amount: owed,
            isPaid: fee.paidAmount > 0
        });
        return acc;
    }, {});

    const summaryList = Object.values(summary).sort((a: any, b: any) => b.totalOwed - a.totalOwed);

    // Totales agregados para el encabezado
    const totalInstHistorical: number = summaryList.reduce((acc: number, s: any) => acc + s.previousMonthsOwed, 0);
    const totalInstCurrent: number = summaryList.reduce((acc: number, s: any) => acc + s.currentMonthOwed, 0);
    const totalInstTotal: number = summaryList.reduce((acc: number, s: any) => acc + s.totalOwed, 0);

    const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];
    const currentMonthLabel = `${monthNames[currentMonth - 1]} ${currentYear}`;

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />
            <main className="container mx-auto px-4 py-8 max-w-5xl">
                <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                            <AlertCircle className="text-rose-600" size={32} />
                            Reporte de Deudores
                        </h1>
                        <p className="text-muted-foreground mt-1 text-sm sm:text-base">Listado detallado de saldos pendientes y cuotas vencidas.</p>
                    </div>
                </header>

                {/* Aggregate Summary Grid */}
                {summaryList.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                        <Card className="p-5 border-rose-200 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-950/10">
                            <div className="flex items-center gap-3 mb-2 text-rose-600">
                                <div className="p-2 bg-rose-100 dark:bg-rose-900/40 rounded-lg">
                                    <Clock size={20} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest">Mora Histórica</span>
                            </div>
                            <h2 className="text-2xl font-black text-rose-600">${totalInstHistorical.toLocaleString()}</h2>
                            <p className="text-[10px] text-muted-foreground mt-1">Total acumulado de meses anteriores</p>
                        </Card>

                        <Card className="p-5 border-amber-200 dark:border-amber-900/30 bg-amber-50/30 dark:bg-amber-950/10">
                            <div className="flex items-center gap-3 mb-2 text-amber-600">
                                <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
                                    <Calendar size={20} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest">Pendiente de {monthNames[currentMonth - 1]}</span>
                            </div>
                            <h2 className="text-2xl font-black text-amber-600">${totalInstCurrent.toLocaleString()}</h2>
                            <p className="text-[10px] text-muted-foreground mt-1">Saldo por cobrar del mes en curso</p>
                        </Card>

                        <Card className="p-5 border-rose-600 bg-rose-600 text-white shadow-lg shadow-rose-200 dark:shadow-rose-900/20">
                            <div className="flex items-center gap-3 mb-2 text-rose-100">
                                <div className="p-2 bg-white/20 rounded-lg">
                                    <AlertTriangle size={20} />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest">Deuda Total Global</span>
                            </div>
                            <h2 className="text-2xl font-black">${totalInstTotal.toLocaleString()}</h2>
                            <p className="text-[10px] text-rose-100/70 mt-1">Suma total de deudas en el instituto</p>
                        </Card>
                    </div>
                )}

                <div className="grid gap-8">
                    {summaryList.length === 0 ? (
                        <Card className="p-20 text-center flex flex-col items-center justify-center border-dashed bg-muted/10">
                            <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                                <User size={32} />
                            </div>
                            <h2 className="text-xl font-bold">Sin deudas pendientes</h2>
                            <p className="text-muted-foreground mt-2 max-w-xs">¡Excelente! Todos los alumnos están al día con sus pagos.</p>
                        </Card>
                    ) : (
                        summaryList.map((s: any, i) => (
                            <Card key={i} className="overflow-hidden border-border/40 hover:shadow-xl transition-all duration-300">
                                <div className="p-6">
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                        <div className="flex items-start gap-4">
                                            <div className="bg-primary/10 p-4 rounded-2xl text-primary font-bold shadow-sm">
                                                {s.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-bold tracking-tight">{s.name}</h3>
                                                <div className="flex flex-wrap items-center gap-4 mt-2">
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                                                        <Phone size={14} className="text-primary/60" />
                                                        {s.phone || "Sin teléfono"}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-wrap gap-3">
                                            {s.previousMonthsOwed > 0 && (
                                                <div className="bg-rose-50 dark:bg-rose-950/20 px-4 py-3 rounded-2xl border border-rose-200 dark:border-rose-900/40 text-center min-w-[140px]">
                                                    <p className="text-[10px] uppercase font-black text-rose-600 dark:text-rose-400 tracking-tighter mb-1">Vencido (Histórico)</p>
                                                    <h4 className="text-lg font-black text-rose-600">${s.previousMonthsOwed.toLocaleString()}</h4>
                                                </div>
                                            )}
                                            <div className="bg-amber-50 dark:bg-amber-950/20 px-4 py-3 rounded-2xl border border-amber-200 dark:border-amber-900/40 text-center min-w-[140px]">
                                                <p className="text-[10px] uppercase font-black text-amber-600 dark:text-amber-400 tracking-tighter mb-1">{monthNames[currentMonth - 1]}</p>
                                                <h4 className="text-lg font-black text-amber-600">${s.currentMonthOwed.toLocaleString()}</h4>
                                            </div>
                                            <div className="bg-rose-600 text-white px-5 py-3 rounded-2xl shadow-lg shadow-rose-200 dark:shadow-rose-900/20 text-center min-w-[140px]">
                                                <p className="text-[10px] uppercase font-black text-rose-100 tracking-tighter mb-1">Deuda Total</p>
                                                <h4 className="text-xl font-black">${s.totalOwed.toLocaleString()}</h4>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-8">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Calendar size={16} className="text-primary" />
                                            <h5 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Desglose de Cuotas</h5>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            {s.months.map((m: any, idx: number) => (
                                                <div 
                                                    key={idx} 
                                                    className={`group p-3 rounded-xl border flex flex-col justify-between gap-1 shadow-sm transition-all hover:bg-muted/10 ${
                                                        m.isCurrent 
                                                            ? 'bg-amber-50/30 border-amber-200/50 dark:bg-amber-950/10 dark:border-amber-900/20' 
                                                            : 'bg-rose-50/30 border-rose-200/50 dark:bg-rose-950/10 dark:border-rose-900/20'
                                                    }`}
                                                >
                                                    <div className="flex justify-between items-start gap-2">
                                                        <span className={`text-[10px] sm:text-xs font-bold ${m.isCurrent ? 'text-amber-600' : 'text-rose-600'}`}>
                                                            {m.label}
                                                        </span>
                                                        {m.isCurrent ? (
                                                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-600 text-[8px] font-black uppercase rounded-md tracking-tighter shrink-0">Pendiente</span>
                                                        ) : (
                                                            <span className="px-1.5 py-0.5 bg-rose-100 text-rose-600 text-[8px] font-black uppercase rounded-md tracking-tighter shrink-0">Vencida</span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm font-black text-foreground">
                                                        ${m.amount.toLocaleString()}
                                                    </div>
                                                    <PendingFeeActions feeId={m.feeId} isPaid={m.isPaid} originalAmount={m.amount} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
