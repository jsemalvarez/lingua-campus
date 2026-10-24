"use client";

import { useState, useEffect, type ReactNode } from "react";
import { Search, Wallet, Percent, ArrowUpRight, ArrowDownLeft, ChevronLeft, ChevronRight, FileText, User } from "lucide-react";
import { formatDate } from "@/lib/dates";
import { TransactionActions } from "./TransactionActions";
import { useRouter, usePathname } from "next/navigation";

interface Transaction {
    id: string;
    originalId?: string;
    date: Date | string;
    /** Qué es: «Cuota Octubre 2026», la descripción de un gasto, «Adelanto de pago». */
    concept: string;
    /** A quién corresponde: el alumno, el docente, o el rubro de un gasto sin destinatario. */
    who?: string | null;
    /** Dónde: el curso de la cuota, o la categoría. */
    where?: string | null;
    /** Las tres partes juntas: lo usan el buscador y el cartel de anular. */
    title: string;
    recipientName?: string | null;
    ticketNumber?: string | null;
    amount: number;
    category?: string;
    description?: string;
    type: "INCOME" | "EXPENSE";
    status: string;
    method: string;
    operatorName?: string;
    note?: string | null;
    /** Aplicación de saldo a favor: no movió caja, pero se puede anular. Ver FIN-11. */
    isCreditApplication?: boolean;
    /** Cuota saldada con un descuento del 100%: tampoco movió caja. Ver FIN-32. */
    isFullDiscount?: boolean;
}

interface TransactionTableProps {
    transactions: Transaction[];
    totalPages: number;
    currentPage: number;
    searchQuery: string;
}

type Kind = "income" | "expense" | "cancel" | "credit" | "discount";

// Los tonos 700: los 500 que usaba la tabla no llegaban a 4,5:1 sobre blanco.
const KIND: Record<Kind, { label: string; text: string; icon: string }> = {
    income: { label: "INGRESO", text: "text-emerald-700 dark:text-emerald-400", icon: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
    expense: { label: "GASTO", text: "text-rose-700 dark:text-rose-400", icon: "bg-rose-500/10 text-rose-700 dark:text-rose-400" },
    // La aplicación de saldo también es un ADJUSTMENT, pero no es una anulación:
    // no se pinta de ámbar ni dice ANULACIÓN.
    cancel: { label: "ANULACIÓN", text: "text-amber-700 dark:text-amber-400", icon: "bg-amber-500/10 text-amber-700 dark:text-amber-400" },
    credit: { label: "SALDO APLICADO", text: "text-blue-700 dark:text-blue-400", icon: "bg-blue-500/10 text-blue-700 dark:text-blue-400" },
    // El índigo es el de «Descuentos Otorgados», arriba en la misma pantalla.
    discount: { label: "DESCUENTO 100%", text: "text-indigo-700 dark:text-indigo-400", icon: "bg-indigo-500/10 text-indigo-700 dark:text-indigo-400" },
};

/** Lo que no entró ni salió de la caja: se muestra sin signo y con «no mueve caja». */
function movesNoCash(tx: Transaction) {
    return !!tx.isCreditApplication || !!tx.isFullDiscount;
}

function kindOf(tx: Transaction): Kind {
    if (tx.isCreditApplication) return "credit";
    if (tx.isFullDiscount) return "discount";
    if (tx.category === "ADJUSTMENT" || tx.category === "REFUND") return "cancel";
    return tx.type === "INCOME" ? "income" : "expense";
}

/** Contra-asientos y anulados no se tocan: sólo el original vigente tiene acciones. */
function hasActions(tx: Transaction) {
    return tx.status !== "VOIDED" && !!tx.originalId &&
        (!!tx.isCreditApplication || (tx.category !== "REFUND" && tx.category !== "ADJUSTMENT"));
}

/**
 * Un dato que se consulta y no se lee en cada fila —la nota, quién cargó el
 * movimiento—: un ícono con el texto en un globo, al pasar el mouse o al tocarlo.
 */
function Hint({ icon, label, text, className }: { icon: ReactNode; label: string; text: string; className: string }) {
    return (
        <span className="relative group/tooltip inline-flex">
            <button
                type="button"
                aria-label={`${label}: ${text}`}
                className={`flex cursor-help transition-opacity ${className}`}
                onClick={(e) => e.preventDefault()}
            >
                {icon}
            </button>
            <span role="tooltip" className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block group-focus-within/tooltip:block w-max max-w-[220px] bg-slate-800 text-white text-[11px] sm:text-xs font-normal normal-case tracking-normal px-3 py-2 rounded-lg shadow-xl z-50 whitespace-normal break-words pointer-events-none">
                <span className="font-bold block mb-0.5 opacity-70">{label}</span>
                {text}
                <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
            </span>
        </span>
    );
}

function MovementIcon({ tx }: { tx: Transaction }) {
    return (
        <div className={`p-2 rounded-full shrink-0 ${KIND[kindOf(tx)].icon}`}>
            {tx.isCreditApplication
                ? <Wallet size={16} />
                : tx.isFullDiscount ? <Percent size={16} />
                : tx.type === "INCOME" ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
        </div>
    );
}

function Amount({ tx }: { tx: Transaction }) {
    const voided = tx.status === "VOIDED";
    return (
        <span className={`font-bold tabular-nums tracking-tight whitespace-nowrap ${KIND[kindOf(tx)].text} ${voided ? "line-through" : ""}`}>
            {/* Sin `+` ni `-`: no entró ni salió plata. El importe está para
                reconocer cuál es, no para sumarlo a la caja. */}
            {movesNoCash(tx) ? "" : tx.type === "INCOME" ? "+" : "-"}${tx.amount.toLocaleString()}
        </span>
    );
}

/**
 * La fila se lee como una frase (FIN-33): arriba el tipo y el concepto
 * —«INGRESO · Cuota Octubre 2026»—, debajo a quién corresponde y, en gris,
 * dónde. El curso es lo que distingue dos cuotas del mismo mes de un alumno con
 * dos inscripciones, que antes se leían idénticas. El tipo va pegado al concepto
 * y no arriba del nombre: «INGRESO» sobre un alumno se leía como que había
 * ingresado el alumno.
 *
 * `trailing` es el importe en la lista del celular, a la altura del concepto.
 */
function MovementText({ tx, trailing }: { tx: Transaction; trailing?: ReactNode }) {
    const kind = KIND[kindOf(tx)];
    const voided = tx.status === "VOIDED";

    return (
        <div className="flex flex-col gap-0.5 min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
                {/* Texto corrido y no una fila de bloques: con la columna angosta, un
                    concepto largo se corta palabra por palabra después del tipo, en
                    vez de bajar entero y dejar «ANULACIÓN ·» suelto arriba. */}
                <p className="min-w-0 text-sm leading-snug">
                    <span className={`text-[11px] font-bold tracking-wide ${kind.text}`}>{kind.label}</span>
                    <span aria-hidden="true" className="text-[11px] text-muted-foreground mx-1.5">·</span>
                    <span className={`font-semibold ${voided ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {tx.concept}
                    </span>
                    {movesNoCash(tx) && (
                        <span
                            className="ml-1.5 text-xs italic text-muted-foreground cursor-help"
                            title={tx.isFullDiscount
                                ? "La cuota se saldó con un descuento por el total: no entró dinero."
                                : "El dinero había ingresado antes, cuando se cobró de más. Aplicarlo no mueve la caja."}
                        >
                            · no mueve caja
                        </span>
                    )}
                    {tx.ticketNumber && (
                        <span className="ml-1.5 inline-block align-middle text-[10px] leading-none font-semibold text-muted-foreground bg-muted/60 px-1.5 py-1 rounded">
                            TKT {tx.ticketNumber}
                        </span>
                    )}
                    {voided && (
                        <span className="ml-1.5 inline-block align-middle text-[10px] leading-none font-semibold text-rose-700 dark:text-rose-400 border border-current px-1.5 py-0.5 rounded">
                            ANULADO
                        </span>
                    )}
                    <span className="ml-1.5 inline-flex align-middle items-center gap-1.5">
                        {/* La nota se ve siempre, tenue: así se sabe qué fila tiene
                            algo para leer sin pasar por encima. */}
                        {tx.note && (
                            <Hint
                                icon={<FileText size={13} />}
                                label="Nota / Motivo"
                                text={tx.note}
                                className="text-muted-foreground/60 hover:text-amber-600 focus:text-amber-600"
                            />
                        )}
                        {/* El operador lo tienen todos: aparece al pasar por la fila,
                            y en el celular, donde no hay mouse, siempre. */}
                        {tx.operatorName && (
                            <Hint
                                icon={<User size={13} />}
                                label="Operador"
                                text={tx.operatorName}
                                className="text-muted-foreground sm:opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-blue-600 focus:text-blue-600"
                            />
                        )}
                    </span>
                </p>
                {trailing}
            </div>
            {tx.who && (
                <span className={`text-[13px] font-medium leading-snug ${voided ? "line-through text-muted-foreground" : "text-foreground/80"}`}>
                    {tx.who}
                </span>
            )}
            {tx.where && <span className="text-xs leading-snug text-muted-foreground">{tx.where}</span>}
        </div>
    );
}

export function TransactionTable({ transactions, totalPages, currentPage, searchQuery: initialSearchQuery }: TransactionTableProps) {
    const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
    const [hoveredOriginalId, setHoveredOriginalId] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    // Sync state with prop if prop changes externally
    useEffect(() => {
        setSearchQuery(initialSearchQuery);
    }, [initialSearchQuery]);

    useEffect(() => {
        const handler = setTimeout(() => {
            const params = new URLSearchParams(window.location.search);
            const currentSearch = params.get("search") || "";
            if (searchQuery !== currentSearch) {
                if (searchQuery) {
                    params.set("search", searchQuery);
                } else {
                    params.delete("search");
                }
                params.set("page", "1");
                router.push(`${pathname}?${params.toString()}`, { scroll: false });
            }
        }, 400);

        return () => clearTimeout(handler);
    }, [searchQuery, pathname, router]);

    const goToPage = (page: number) => {
        const params = new URLSearchParams(window.location.search);
        params.set("page", page.toString());
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const filteredTransactions = transactions;

    // Un movimiento y su anulación se resaltan juntos al pasar por cualquiera de los dos.
    const highlight = (tx: Transaction) =>
        hoveredOriginalId && tx.originalId === hoveredOriginalId
            ? "bg-primary/5 ring-1 ring-inset ring-primary/20"
            : "hover:bg-muted/30";
    const hoverProps = (tx: Transaction) => ({
        onMouseEnter: () => tx.originalId && setHoveredOriginalId(tx.originalId),
        onMouseLeave: () => setHoveredOriginalId(null),
    });
    const actionsFor = (tx: Transaction, alwaysVisible = false) => hasActions(tx) && (
        <TransactionActions
            alwaysVisible={alwaysVisible}
            tx={{
                id: tx.originalId!,
                description: tx.title,
                amount: tx.amount,
                source: tx.category!,
                isCreditApplication: tx.isCreditApplication,
                isFullDiscount: tx.isFullDiscount
            }}
        />
    );

    return (
        <div className="lg:col-span-2 space-y-4">
            <div className="bg-card border border-border/40 rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <Wallet className="text-primary" size={20} /> Movimientos Recientes
                    </h2>
                    <div className="relative w-full sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <input
                            type="text"
                            aria-label="Buscar movimientos"
                            placeholder="Buscar por alumno, curso, concepto o ticket..."
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {filteredTransactions.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground italic text-sm">
                        {searchQuery
                            ? `No se encontraron movimientos que coincidan con "${searchQuery}"`
                            : "Aún no hay movimientos contables registrados en la base de datos de tu instituto."
                        }
                    </div>
                ) : (
                    <>
                        {/* Computadora: la columna del movimiento envuelve en renglones en
                            vez de estirarse, así que Monto y Acciones no se salen de la
                            pantalla (BUG-10) y ya no hace falta desplazar la tabla. */}
                        <table className="hidden sm:table w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider font-semibold border-b border-border/50">
                                    <th className="px-5 py-4">Movimiento</th>
                                    <th className="px-4 py-4 w-28">Fecha</th>
                                    <th className="px-4 py-4 w-32 text-right">Monto</th>
                                    <th className="px-5 py-4 w-28 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {filteredTransactions.map((tx) => {
                                    const voided = tx.status === "VOIDED";
                                    return (
                                        <tr key={tx.id} className={`transition-all duration-200 group relative ${highlight(tx)}`} {...hoverProps(tx)}>
                                            <td className="px-5 py-3.5">
                                                <div className={`flex items-start gap-3 ${voided ? "opacity-60 grayscale" : ""}`}>
                                                    <MovementIcon tx={tx} />
                                                    <MovementText tx={tx} />
                                                </div>
                                            </td>
                                            <td className={`px-4 py-3.5 text-xs font-medium text-muted-foreground whitespace-nowrap ${voided ? "opacity-60" : ""}`}>
                                                {/* El día contable (FIN-34): un cobro de las 21:30 es de ese día, no del siguiente. */}
                                                {formatDate(tx.date, "day", "short")}
                                            </td>
                                            <td className={`px-4 py-3.5 text-right ${voided ? "opacity-60" : ""}`}>
                                                <Amount tx={tx} />
                                            </td>
                                            <td className="px-5 py-3 text-right">
                                                {actionsFor(tx)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        {/* Celular: una lista. El importe va arriba, a la altura del
                            concepto; la fecha y las acciones, abajo. */}
                        <ul className="sm:hidden divide-y divide-border/50">
                            {filteredTransactions.map((tx) => {
                                const voided = tx.status === "VOIDED";
                                return (
                                    <li key={tx.id} className={`group flex items-start gap-3 px-4 pt-3.5 pb-1 transition-colors ${highlight(tx)}`} {...hoverProps(tx)}>
                                        <div className={voided ? "opacity-60 grayscale" : ""}>
                                            <MovementIcon tx={tx} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={voided ? "opacity-60 grayscale" : ""}>
                                                <MovementText tx={tx} trailing={<Amount tx={tx} />} />
                                            </div>
                                            <div className="flex items-center justify-between gap-2 min-h-11">
                                                <span className="text-xs font-medium text-muted-foreground">
                                                    {formatDate(tx.date, "day", "short")}
                                                </span>
                                                <div className="-mr-3">{actionsFor(tx, true)}</div>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>

                        {/* Pagination Bar */}
                        <div className="p-4 border-t border-border/50 flex items-center justify-between bg-muted/10">
                            <p className="text-xs text-muted-foreground font-medium">
                                Página <span className="text-foreground font-bold">{currentPage}</span> de <span className="text-foreground font-bold">{totalPages}</span>
                            </p>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage <= 1}
                                    className="p-1.5 rounded-lg border border-border/60 hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    title="Página Anterior"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage >= totalPages}
                                    className="p-1.5 rounded-lg border border-border/60 hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                    title="Siguiente Página"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
