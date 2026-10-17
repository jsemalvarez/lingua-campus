import { Card } from "@/components/ui/Card";
import { CalendarClock } from "lucide-react";

export interface UpcomingFee {
    id: string;
    label: string;
    studentName?: string;
    originalAmount: number;
    paidAmount: number;
    /** El día del examen, o null si el curso todavía no lo tiene cargado. */
    dueDate: Date | null;
}

/**
 * Los pagos que todavía no vencen —hoy, el derecho de examen antes del examen—,
 * fuera de la deuda. Las familias lo van pagando de a partes durante el año, así
 * que lo que importa ver es cuánto llevan y cuándo se rinde.
 *
 * No usa hooks: lo arman tanto el portal de las familias (servidor) como el
 * estado de cuenta del alumno adulto (cliente).
 */
export function UpcomingFeesSection({ fees }: { fees: UpcomingFee[] }) {
    if (fees.length === 0) return null;

    const formatter = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });
    // La fecha llega a medianoche UTC: leída en hora de Argentina caería el día
    // anterior, así que se arma desde el texto ISO.
    const formatDate = (d: Date) => new Date(d).toISOString().slice(0, 10).split("-").reverse().join("/");

    return (
        <section className="space-y-4">
            <div className="px-2">
                <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                    <CalendarClock size={22} className="text-purple-500" /> Próximos pagos
                </h3>
                <p className="text-sm text-muted-foreground font-medium mt-1">
                    Se pueden ir pagando en partes hasta la fecha del examen.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {fees.map(fee => {
                    const remaining = Math.max(0, fee.originalAmount - fee.paidAmount);
                    const progress = fee.originalAmount > 0
                        ? Math.min(100, Math.round((fee.paidAmount / fee.originalAmount) * 100))
                        : 0;

                    return (
                        <Card
                            key={`upcoming-${fee.id}`}
                            className="p-6 border-y-0 border-r-0 border-l-4 border-l-purple-500 shadow-md bg-card rounded-[2rem] space-y-4"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    {fee.studentName && (
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{fee.studentName}</p>
                                    )}
                                    <h4 className="text-lg font-black tracking-tight">{fee.label}</h4>
                                    <p className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded w-fit mt-1 bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300">
                                        {fee.dueDate ? `Vence el ${formatDate(fee.dueDate)}` : "Pago futuro"}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1 leading-none">Falta</p>
                                    <p className="text-2xl font-black text-foreground">{formatter.format(remaining)}</p>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                                    <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${progress}%` }} />
                                </div>
                                <p className="text-xs text-muted-foreground font-medium">
                                    Pagado {formatter.format(fee.paidAmount)} de {formatter.format(fee.originalAmount)}
                                </p>
                            </div>
                        </Card>
                    );
                })}
            </div>
        </section>
    );
}
