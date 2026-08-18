"use client";

import { useState, useEffect } from "react";
import { Search, Wallet, ArrowUpRight, ArrowDownLeft, ChevronLeft, ChevronRight, Link2 } from "lucide-react";
import dayjs from "dayjs";
import { TransactionActions } from "./TransactionActions";
import { useRouter, usePathname } from "next/navigation";

interface Transaction {
    id: string;
    originalId?: string;
    date: Date | string;
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
    relatedTitle?: string | null;
    /** Aplicación de saldo a favor: no movió caja, pero se puede anular. Ver FIN-11. */
    isCreditApplication?: boolean;
}

interface TransactionTableProps {
    transactions: Transaction[];
    totalPages: number;
    currentPage: number;
    searchQuery: string;
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
                            placeholder="Buscar por concepto, ticket o categoría..."
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
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse whitespace-nowrap">
                                <thead>
                                    <tr className="bg-muted/30 text-muted-foreground text-xs uppercase tracking-wider font-semibold border-b border-border/50">
                                        <th className="px-5 py-4">Concepto / Referencia</th>
                                        <th className="px-5 py-4">Fecha</th>
                                        <th className="px-5 py-4 text-right">Monto</th>
                                        <th className="px-5 py-4 text-right pr-8">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {filteredTransactions.map((tx) => {
                                        const displayTitle = tx.title;
                                        const noteStr = tx.note || null;

                                            // La aplicación de saldo también es un ADJUSTMENT, pero no
                                            // es una anulación: no se pinta de ámbar ni dice ANULACIÓN.
                                            const isCancellation = !tx.isCreditApplication &&
                                                (tx.category === "ADJUSTMENT" || tx.category === "REFUND");
                                            const isHighlighted = hoveredOriginalId && tx.originalId === hoveredOriginalId;

                                            return (
                                        <tr 
                                            key={tx.id} 
                                            className={`transition-all duration-200 group relative ${
                                                isHighlighted 
                                                    ? "bg-primary/5 ring-1 ring-inset ring-primary/20 z-10" 
                                                    : "hover:bg-muted/30"
                                            }`}
                                            onMouseEnter={() => tx.originalId && setHoveredOriginalId(tx.originalId)}
                                            onMouseLeave={() => setHoveredOriginalId(null)}
                                        >
                                            <td className="px-5 py-4">
                                                <div className={`flex items-center gap-3 ${tx.status === "VOIDED" ? "opacity-50 grayscale" : ""}`}>
                                                    <div className={`p-2 rounded-full ${
                                                        tx.isCreditApplication
                                                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                                            : isCancellation
                                                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                                : tx.type === "INCOME"
                                                                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                                                    : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                                    }`}>
                                                        {tx.isCreditApplication
                                                            ? <Wallet size={16} />
                                                            : tx.type === "INCOME" ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                                                    </div>
                                                    {/* El tope de ancho va acá y no en el `<td>`: la tabla es de
                                                        layout automático y el `max-width` de una celda es apenas
                                                        una sugerencia, la de un div se respeta. Sin esto, la
                                                        segunda línea —etiqueta, "Anula a: …", ticket, ANULADO—
                                                        crece con su contenido, y como la tabla es
                                                        `whitespace-nowrap` empuja Monto y Acciones fuera de la
                                                        pantalla: parece que desaparecieron los importes de todos
                                                        los movimientos. Ver BUG-10. */}
                                                    <div className="flex flex-col min-w-0 max-w-[350px]">
                                                        <span className={`font-semibold text-sm truncate ${tx.status === "VOIDED" ? "line-through text-muted-foreground" : ""}`} title={displayTitle}>
                                                            {displayTitle}
                                                        </span>
                                                        {/* Envuelve en vez de estirar: la fila se hace más alta,
                                                            que es barato, y las columnas de la derecha no se mueven. */}
                                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 whitespace-normal text-xs font-medium mt-0.5">
                                                            <span className={
                                                                tx.isCreditApplication
                                                                    ? "text-blue-500"
                                                                    : isCancellation
                                                                        ? "text-amber-500"
                                                                        : tx.type === "INCOME"
                                                                            ? "text-emerald-500"
                                                                            : "text-rose-500"
                                                            }>
                                                                {tx.isCreditApplication
                                                                    ? "SALDO APLICADO"
                                                                    : isCancellation ? "ANULACIÓN" : tx.type === "INCOME" ? "INGRESO" : "GASTO"}
                                                            </span>
                                                            {/* Corto a propósito: la tabla es `whitespace-nowrap` y esta
                                                                línea no trunca, así que un texto largo acá ensancha la
                                                                columna y empuja Monto y Acciones fuera de la pantalla.
                                                                La explicación entera va en el tooltip. */}
                                                            {tx.isCreditApplication && (
                                                                <>
                                                                    <span className="text-muted-foreground/30">·</span>
                                                                    <span
                                                                        className="text-muted-foreground italic cursor-help"
                                                                        title="El dinero había ingresado antes, cuando se cobró de más. Aplicarlo no mueve la caja."
                                                                    >
                                                                        no mueve caja
                                                                    </span>
                                                                </>
                                                            )}
                                                            {tx.relatedTitle && (
                                                                <>
                                                                    <span className="text-muted-foreground/30">·</span>
                                                                    <span className="text-amber-600/80 flex items-center gap-1 italic">
                                                                        <Link2 size={10} />
                                                                        Anula a: {tx.relatedTitle}
                                                                    </span>
                                                                </>
                                                            )}
                                                            {tx.ticketNumber && (
                                                                <>
                                                                    <span className="text-muted-foreground/30">·</span>
                                                                    <span className="text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded text-[10px]">
                                                                        TKT: {tx.ticketNumber}
                                                                    </span>
                                                                </>
                                                            )}
                                                            {tx.status === "VOIDED" && <span className="text-rose-500 border border-rose-500 px-1.5 py-0.5 rounded text-[10px]">ANULADO</span>}

                                                            {/* Íconos Adicionales: Motivo y Operador (Visibles al hacer hover en la fila) */}
                                                            <div className="flex items-center gap-1.5 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                                                {noteStr && (
                                                                    <div className="relative group/tooltip flex">
                                                                        <button type="button" className="text-muted-foreground hover:text-amber-600 focus:text-amber-600 cursor-help" onClick={(e) => e.preventDefault()}>
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                                                                        </button>
                                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block sm:group-focus-within/tooltip:block w-max max-w-[200px] bg-slate-800 text-white text-[10px] sm:text-xs px-3 py-2 rounded-lg shadow-xl z-50 whitespace-normal break-words pointer-events-none">
                                                                            <span className="font-bold block mb-0.5 opacity-70">Nota / Motivo:</span>
                                                                            {noteStr}
                                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                
                                                                {tx.operatorName && (
                                                                    <div className="relative group/tooltip flex">
                                                                        <button type="button" className="text-muted-foreground hover:text-blue-600 focus:text-blue-600 cursor-help" onClick={(e) => e.preventDefault()}>
                                                                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                                                        </button>
                                                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/tooltip:block sm:group-focus-within/tooltip:block w-max bg-slate-800 text-white text-[10px] sm:text-xs px-3 py-1.5 rounded-lg shadow-xl z-50 whitespace-nowrap pointer-events-none">
                                                                            Operador: <span className="font-bold">{tx.operatorName}</span>
                                                                            <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={`px-5 py-4 text-xs font-medium text-muted-foreground ${tx.status === "VOIDED" ? "opacity-50" : ""}`}>
                                                {dayjs(new Date(tx.date).toISOString().split('T')[0]).format("DD MMM, YYYY")}
                                            </td>
                                            <td className={`px-5 py-4 text-right ${tx.status === "VOIDED" ? "opacity-50" : ""}`}>
                                                <span className={`font-bold tabular-nums tracking-tight ${
                                                    tx.isCreditApplication
                                                        ? "text-blue-600 dark:text-blue-400"
                                                        : isCancellation
                                                            ? "text-amber-600 dark:text-amber-400"
                                                            : tx.type === "INCOME"
                                                                ? "text-emerald-600 dark:text-emerald-400"
                                                                : "text-rose-600 dark:text-rose-400"
                                                } ${tx.status === "VOIDED" ? "line-through" : ""}`}>
                                                    {/* Sin `+` ni `-`: no entró ni salió plata. El importe está para
                                                        reconocer cuál es, no para sumarlo a la caja. */}
                                                    {tx.isCreditApplication ? "" : tx.type === "INCOME" ? "+" : "-"}${tx.amount.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right pr-6">
                                                {tx.status !== "VOIDED" && tx.originalId &&
                                                 (tx.isCreditApplication || (tx.category !== "REFUND" && tx.category !== "ADJUSTMENT")) && (
                                                    <TransactionActions
                                                        tx={{
                                                            id: tx.originalId,
                                                            description: displayTitle,
                                                            amount: tx.amount,
                                                            source: tx.category!,
                                                            isCreditApplication: tx.isCreditApplication
                                                        }}
                                                    />
                                                )}
                                            </td>
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

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
