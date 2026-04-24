import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Navbar } from "@/components/layout/Navbar";
import { 
    Wallet, 
    FileText, 
    CheckCircle2, 
    AlertCircle, 
    DollarSign, 
    TrendingDown,
    Calendar,
    ArrowUpRight,
    ArrowRightCircle,
    Receipt,
    Info
} from "lucide-react";
import dayjs from "dayjs";
import { getMonthName, cn } from "@/lib/utils";
import { ReceiptDownloadButton } from "@/components/financials/ReceiptDownloadButton";
import { getActiveRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

export default async function GuardianPaymentsPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        redirect("/login");
    }

    const sessionUser = session.user as any;
    const userRoles = sessionUser.roles || [sessionUser.role];
    const activeRole = await getActiveRole(userRoles);

    if (activeRole !== "GUARDIAN") {
        redirect("/dashboard");
    }

    const guardianId = sessionUser.id;

    const guardianLinks = await prisma.guardianStudentLink.findMany({
        where: { guardianId },
        include: {
            student: {
                select: {
                    id: true,
                    name: true,
                    creditBalance: true,
                    fees: {
                        orderBy: [{ year: 'desc' }, { month: 'desc' }],
                        include: {
                            payments: { where: { status: "VALID" } }
                        }
                    }
                }
            }
        }
    });

    if (guardianLinks.length === 0) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar currentActiveRole={activeRole} />
                <main className="container mx-auto px-4 py-20 text-center">
                    <p className="text-muted-foreground">No tienes alumnos vinculados.</p>
                </main>
            </div>
        );
    }

    const students = guardianLinks.map(l => l.student);
    
    const allFees = students.flatMap(s => s.fees.map(f => ({ ...f, studentName: s.name })))
        .sort((a,b) => {
            if (a.year !== b.year) return b.year - a.year;
            return b.month - a.month;
        });

    const pendingFees = allFees.filter(f => f.status !== "PAID");
    const paidFees = allFees.filter(f => f.status === "PAID" && f.paidAmount > 0);
    
    // Nueva lógica de segmentación de deuda
    const now = dayjs();
    const currentMonth = now.month(); // 0-11
    const currentYear = now.year();

    const oldDebtFees = pendingFees.filter(f => f.year < currentYear || (f.year === currentYear && f.month < currentMonth));
    const currentMonthFees = pendingFees.filter(f => f.year === currentYear && f.month === currentMonth);

    const oldDebtSum = oldDebtFees.reduce((acc, f) => acc + (f.originalAmount - f.paidAmount), 0);
    const currentMonthDebtSum = currentMonthFees.reduce((acc, f) => acc + (f.originalAmount - f.paidAmount), 0);
    const totalCreditBalance = students.reduce((acc, s) => acc + s.creditBalance, 0);

    const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });

    return (
        <div className="min-h-screen bg-background pb-24">
            <Navbar currentActiveRole={activeRole} />
            
            <main className="container mx-auto px-4 sm:px-6 py-10 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl">
                
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/50">
                    <div className="space-y-1">
                        <span className="text-sm font-bold text-primary/80 uppercase tracking-widest flex items-center gap-2">
                            <Wallet size={16} /> Panel Administrativo
                        </span>
                        <h1 className="text-4xl font-extrabold tracking-tight">Estado de Cuenta</h1>
                        <p className="text-muted-foreground font-medium">Control centralizado de cuotas, pagos y comprobantes.</p>
                    </div>
                </header>

                {/* METRICS ROW */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* DEUDA CARD (ANTERIOR) */}
                    <Card className="p-8 border-y-0 border-r-0 border-l-4 border-l-rose-500 shadow-xl bg-gradient-to-br from-rose-500/10 to-transparent relative overflow-hidden rounded-[2.5rem]">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <AlertCircle size={80} className="text-rose-600" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-rose-600 mb-2">Deuda</p>
                        <h2 className="text-4xl font-black tracking-tight">{formatter.format(oldDebtSum)}</h2>
                        <div className="mt-4 flex items-center gap-2 text-rose-600/70 font-bold text-sm">
                            <TrendingDown size={14} /> Ciclos anteriores
                        </div>
                    </Card>

                    {/* PENDIENTE CARD (MES ACTUAL) */}
                    <Card className="p-8 border-y-0 border-r-0 border-l-4 border-l-amber-500 shadow-xl bg-gradient-to-br from-amber-500/10 to-transparent relative overflow-hidden rounded-[2.5rem]">
                        <div className="absolute top-0 right-0 p-8 opacity-10">
                            <Calendar size={80} className="text-amber-600" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-amber-600 mb-2">Pendiente</p>
                        <h2 className="text-4xl font-black tracking-tight">{formatter.format(currentMonthDebtSum)}</h2>
                        <p className="mt-4 text-xs text-muted-foreground font-medium">Vencimiento del mes en curso.</p>
                    </Card>

                    {/* SALDO A FAVOR CARD */}
                    <Card className="p-8 border-y-0 border-r-0 border-l-4 border-l-emerald-500 shadow-xl bg-gradient-to-br from-emerald-500/10 to-transparent relative overflow-hidden group rounded-[2.5rem]">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-500">
                            <ArrowUpRight size={80} className="text-emerald-600" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-2">Saldo a Favor</p>
                        <h2 className="text-4xl font-black tracking-tight">{formatter.format(totalCreditBalance)}</h2>
                        <p className="mt-4 text-xs text-muted-foreground font-medium">Crédito disponible para futuras cuotas.</p>
                    </Card>
                </div>

                {/* MAIN CONTENT GRID */}
                <div className="grid lg:grid-cols-5 gap-8 items-start">
                    
                    {/* LEFT: PENDING LIST (60%) */}
                    <div className="lg:col-span-3 space-y-6 flex flex-col h-full">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                                <DollarSign size={22} className="text-rose-500" /> Detalle de Cuotas
                            </h3>
                            <span className="bg-rose-100 dark:bg-rose-900/30 text-rose-600 text-[10px] font-black uppercase px-3 py-1 rounded-full">
                                {pendingFees.length} Cuotas registradas
                            </span>
                        </div>

                        <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-[640px] flex-1">
                            {pendingFees.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center py-20 bg-muted/20 border border-dashed border-border/50 rounded-[2rem]">
                                    <CheckCircle2 size={48} className="text-emerald-500 opacity-20 mb-4" />
                                    <p className="text-muted-foreground font-medium italic">¡Estás al día! No hay deudas pendientes.</p>
                                </div>
                            ) : (
                                pendingFees.map(fee => (
                                    <Card key={`pending-${fee.id}`} className="p-6 border-none shadow-md bg-card rounded-[2rem] hover:shadow-lg transition-all active:scale-[0.99] group overflow-hidden">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 bg-muted/50 rounded-2xl flex items-center justify-center shrink-0">
                                                    <Calendar className="text-primary" size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{fee.studentName}</p>
                                                    <h4 className="text-lg font-black tracking-tight">Cuota {getMonthName(fee.month)} {fee.year}</h4>
                                                    <p className={cn(
                                                        "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded w-fit mt-1",
                                                        (fee.year < currentYear || (fee.year === currentYear && fee.month < currentMonth)) 
                                                            ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30" 
                                                            : "bg-amber-100 text-amber-600 dark:bg-amber-900/30"
                                                    )}>
                                                        {fee.year < currentYear || (fee.year === currentYear && fee.month < currentMonth) ? "Deuda Morosa" : "Vencimiento Actual"}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between sm:justify-end gap-6 sm:text-right border-t sm:border-t-0 pt-4 sm:pt-0 border-border/50">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 leading-none">Total por abonar</p>
                                                    <p className="text-2xl font-black text-foreground">
                                                        {formatter.format(fee.originalAmount - fee.paidAmount)}
                                                    </p>
                                                </div>
                                                <button className="bg-primary hover:bg-primary/90 text-white p-3 rounded-2xl shadow-lg shadow-primary/20 transition-all hover:scale-110 active:scale-95 group-hover:rotate-6">
                                                    <ArrowRightCircle size={24} />
                                                </button>
                                            </div>
                                        </div>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>

                    {/* RIGHT: STUDENT BALANCE SUMMARY & RECENT PAYMENTS (40%) */}
                    <div className="lg:col-span-2 space-y-6 flex flex-col h-full">
                        <section className="space-y-4">
                            <h3 className="text-xl font-black tracking-tight flex items-center gap-2 px-2">
                                <TrendingDown size={22} className="text-primary" /> Deuda por Alumno
                            </h3>
                            <div className="space-y-4">
                                {students.map(student => {
                                    const studentDebt = student.fees
                                        .filter((f:any) => f.status !== "PAID" && f.status !== "VOIDED")
                                        .reduce((acc:number, f:any) => acc + (f.originalAmount - f.paidAmount), 0);
                                    
                                    return (
                                        <Card key={`student-${student.id}`} className="p-6 border-y-0 border-r-0 border-l-4 border-l-primary shadow-lg bg-card rounded-[2rem] flex items-center justify-between">
                                            <div>
                                                <h4 className="font-black text-lg">{student.name}</h4>
                                                <p className="text-xs text-muted-foreground font-medium">Balance detallado</p>
                                            </div>
                                            <div className="text-right">
                                                <p className={cn(
                                                    "text-xl font-black",
                                                    studentDebt > 0 ? "text-rose-600" : "text-emerald-600"
                                                )}>
                                                    {formatter.format(studentDebt)}
                                                </p>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        </section>

                        {/* RECENT PAYMENTS SUMMARY */}
                        <section className="space-y-4">
                            <h3 className="text-lg font-black tracking-tight flex items-center gap-2 px-2">
                                <CheckCircle2 size={20} className="text-emerald-500" /> Pagos Recientes
                            </h3>
                            <Card className="p-8 bg-emerald-500/5 border border-emerald-500/20 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
                                <div className="absolute -right-4 -top-4 opacity-[0.03] group-hover:scale-110 group-hover:rotate-12 transition-all duration-700">
                                    <Receipt size={120} />
                                </div>
                                {paidFees.length === 0 ? (
                                    <p className="text-sm text-muted-foreground italic text-center py-4">No hay pagos registrados aún.</p>
                                ) : (
                                    <div className="space-y-6 relative z-10">
                                        {paidFees.slice(0, 3).map(fee => (
                                            <div key={`recent-${fee.id}`} className="flex items-center justify-between group/item">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-sm shrink-0">
                                                        <DollarSign size={18} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-black truncate">Cuota {getMonthName(fee.month)}</p>
                                                        <p className="text-[10px] text-muted-foreground font-medium">{dayjs(fee.datePaid).format("DD/MM/YYYY")}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-black text-emerald-600">{formatter.format(fee.paidAmount)}</p>
                                                    <p className="text-[9px] font-bold uppercase tracking-tighter text-muted-foreground">{fee.studentName.split(" ")[0]}</p>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="pt-6 border-t border-emerald-500/10">
                                            <div className="flex gap-3">
                                                <div className="p-1.5 h-fit bg-emerald-500/10 rounded-lg text-emerald-600">
                                                    <Info size={14} />
                                                </div>
                                                <p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
                                                    Podés abonar vía transferencia o en recepción. Recordá descargar tus comprobantes debajo.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Card>
                        </section>
                    </div>

                </div>

                {/* BOTTOM: TRANSACTION HISTORY (Full Width) */}
                <section className="space-y-6 pt-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-2xl font-black tracking-tight flex items-center gap-2">
                            <Receipt size={24} className="text-emerald-500" /> Historial y Recibos
                        </h3>
                    </div>

                    <Card className="p-0 border-y-0 border-r-0 border-l-4 border-l-emerald-500 shadow-2xl bg-card rounded-[2.5rem] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border/50 text-left bg-muted/30">
                                        <th className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Alumno / Concepto</th>
                                        <th className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Fecha de Pago</th>
                                        <th className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground">Efectuado el</th>
                                        <th className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground text-right">Monto</th>
                                        <th className="p-6 text-xs font-black uppercase tracking-widest text-muted-foreground text-center">Recibo</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/30">
                                    {paidFees.slice(0, 10).map(fee => (
                                        <tr key={`hist-row-${fee.id}`} className="hover:bg-muted/10 transition-colors group">
                                            <td className="p-6">
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase mb-0.5">{fee.studentName}</p>
                                                <p className="font-black">Cuota {getMonthName(fee.month)} {fee.year}</p>
                                            </td>
                                            <td className="p-6">
                                                <span className="font-bold text-emerald-600">PAGADO</span>
                                            </td>
                                            <td className="p-6">
                                                <span className="text-muted-foreground font-medium">{dayjs(fee.datePaid).format("DD/MM/YYYY")}</span>
                                            </td>
                                            <td className="p-6 text-right">
                                                <span className="font-black text-emerald-600">
                                                    {formatter.format(fee.paidAmount)}
                                                </span>
                                            </td>
                                            <td className="p-6 text-center">
                                                {fee.payments && fee.payments[0] && (
                                                    <ReceiptDownloadButton 
                                                        paymentId={fee.payments[0].id} 
                                                        variant="ghost" 
                                                        className="hover:bg-emerald-500/10 text-emerald-600 rounded-xl" 
                                                    />
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </section>

                {/* DECORATIVE FOOTER LOGO */}
                <div className="flex justify-center opacity-10 pb-10">
                    <Wallet size={120} />
                </div>

            </main>
        </div>
    );
}
