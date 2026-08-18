"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Undo2, Wallet } from "lucide-react";
import dayjs from "dayjs";
import { Card } from "@/components/ui/Card";
import { voidPaymentAction } from "@/app/payments/actions";
import { formatCurrency } from "@/lib/utils";

/**
 * Los pagos con método SALDO del alumno, con su botón de anular.
 *
 * Es el único acceso que existe a esos pagos: su asiento en el libro mayor es de
 * $0 —la plata entró antes, cuando se cobró de más— y la tabla de `/payments`
 * filtra los movimientos en $0 porque es la caja. Sin este bloque, la política
 * de FIN-01 deja al operador trabado: no puede anular el pago original hasta
 * anular la aplicación de saldo, y la aplicación de saldo no se ve en ningún
 * lado. Ver FIN-11.
 *
 * La lista viene de una consulta propia, no de las cuotas que muestra el resto
 * de la ficha: esas traen las últimas 5 y un pago por cuota, así que la
 * aplicación de saldo que hay que anular puede no estar entre ellas.
 */
export interface AppliedCredit {
    id: string;
    label: string;
    amount: number;
    date: Date;
}

export function AppliedCreditList({ payments }: { payments: AppliedCredit[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [confirming, setConfirming] = useState<AppliedCredit | null>(null);
    const [reason, setReason] = useState("");

    const handleVoid = () => {
        if (!confirming) return;

        startTransition(async () => {
            const res = await voidPaymentAction(confirming.id, reason.trim() || undefined);

            if (res.success) {
                setConfirming(null);
                setReason("");
                // `voidPaymentAction` revalida `/payments`, no esta ruta.
                router.refresh();
            } else {
                alert(res.error || "No se pudo anular la aplicación de saldo");
            }
        });
    };

    return (
        <Card className="p-5 border-border/40 bg-card/60">
            <h3 className="font-bold flex items-center gap-2 mb-1 text-sm uppercase tracking-wider text-muted-foreground">
                <Wallet size={16} /> Saldo a Favor Aplicado
            </h3>
            <p className="text-[10px] text-muted-foreground/70 mb-4 font-medium italic">
                Saldo del alumno usado para pagar cuotas. Anularlo se lo devuelve.
            </p>

            <div className="space-y-4">
                {payments.map(p => (
                    <div
                        key={p.id}
                        className="flex flex-col gap-1.5 text-sm border-b border-border/30 pb-3 pt-2 first:pt-0 last:border-0 last:pb-0"
                    >
                        <div className="flex justify-between items-start">
                            <span className="font-medium text-foreground/90 leading-tight">{p.label}</span>
                            <span className="text-xs text-muted-foreground shrink-0">
                                {dayjs(p.date).format("DD/MM")}
                            </span>
                        </div>
                        <div className="flex justify-between items-center mt-0.5">
                            <span className="font-bold text-blue-600 dark:text-blue-400">
                                ${formatCurrency(p.amount)}
                            </span>
                            <button
                                type="button"
                                onClick={() => setConfirming(p)}
                                title="Anular la aplicación de saldo"
                                className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-bold text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                            >
                                <Undo2 size={14} /> Anular
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {confirming && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-background border border-border rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 text-left">
                        <div className="p-6 text-center">
                            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">¿Anular esta aplicación de saldo?</h3>
                            <p className="text-muted-foreground text-sm">
                                Se le devuelven <span className="font-semibold text-foreground">${formatCurrency(confirming.amount)}</span> al
                                saldo a favor del alumno y <span className="font-semibold text-foreground">{confirming.label}</span> vuelve
                                a quedar impaga.
                                <br /><br />
                                No sale ni entra plata de la caja: ese dinero ya había ingresado.
                            </p>
                            <textarea
                                className="w-full mt-4 p-3 rounded-lg border border-input bg-background text-sm resize-none focus:ring-2 focus:ring-primary/20 outline-none"
                                rows={2}
                                placeholder="Motivo de la anulación (opcional)..."
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                            />
                        </div>
                        <div className="flex border-t border-border/50">
                            <button
                                onClick={() => { setConfirming(null); setReason(""); }}
                                className="flex-1 py-4 text-sm font-medium hover:bg-muted transition-colors border-r border-border/50"
                                disabled={isPending}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleVoid}
                                className="flex-1 py-4 text-sm font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors"
                                disabled={isPending}
                            >
                                {isPending ? "Procesando..." : "Sí, Anular"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}
