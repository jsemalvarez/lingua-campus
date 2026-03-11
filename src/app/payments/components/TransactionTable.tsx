"use client";

import { useState } from "react";
import { Search, Wallet, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import dayjs from "dayjs";
import { ExpenseActions } from "./ExpenseActions";

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
}

interface TransactionTableProps {
    transactions: Transaction[];
}

export function TransactionTable({ transactions }: TransactionTableProps) {
    const [searchQuery, setSearchQuery] = useState("");

    const normalizeString = (str: string) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const filteredTransactions = transactions.filter((tx) => {
        const query = normalizeString(searchQuery);
        const title = normalizeString(tx.title || "");
        const description = normalizeString(tx.description || "");
        const category = normalizeString(tx.category || "");
        const ticket = normalizeString(tx.ticketNumber || "");
        
        return (
            title.includes(query) ||
            description.includes(query) ||
            category.includes(query) ||
            ticket.includes(query)
        );
    });

    return (
        <div className="lg:col-span-2">
            <div className="bg-card border border-border/40 rounded-xl overflow-hidden">
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
                                {filteredTransactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-muted/30 transition-colors group">
                                        <td className="px-5 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-full ${
                                                    tx.type === "INCOME" 
                                                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                                        : tx.category === "NOMINA"
                                                            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                                                }`}>
                                                    {tx.type === "INCOME" ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-sm max-w-[200px] truncate" title={tx.title}>
                                                        {tx.title}
                                                    </span>
                                                    <div className="flex items-center gap-2 text-xs font-medium mt-0.5">
                                                        <span className={
                                                            tx.type === "INCOME" 
                                                                ? "text-emerald-500" 
                                                                : tx.category === "NOMINA"
                                                                    ? "text-amber-500"
                                                                    : "text-rose-500"
                                                        }>
                                                            {tx.type === "INCOME" ? "INGRESO" : "GASTO"}
                                                        </span>
                                                        {tx.ticketNumber && (
                                                            <>
                                                                <span className="text-muted-foreground/30">·</span>
                                                                <span className="text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded text-[10px]">
                                                                    TKT: {tx.ticketNumber}
                                                                </span>
                                                            </>
                                                        )}
                                                        {tx.status === "PENDING" && <span className="text-orange-500">· PENDIENTE</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-5 py-4 text-xs font-medium text-muted-foreground">
                                            {dayjs(new Date(tx.date).toISOString().split('T')[0]).format("DD MMM, YYYY")}
                                        </td>
                                        <td className="px-5 py-4 text-right">
                                            <span className={`font-bold tabular-nums tracking-tight ${
                                                tx.type === "INCOME" 
                                                    ? "text-emerald-600 dark:text-emerald-400" 
                                                    : tx.category === "NOMINA"
                                                        ? "text-amber-600 dark:text-amber-400"
                                                        : "text-rose-600 dark:text-rose-400"
                                            }`}>
                                                {tx.type === "INCOME" ? "+" : "-"}${tx.amount.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-right pr-6">
                                            {tx.type === "EXPENSE" && (
                                                <ExpenseActions 
                                                    expense={{
                                                        id: tx.originalId!,
                                                        description: tx.description!,
                                                        amount: tx.amount,
                                                        category: tx.category!,
                                                        recipientName: tx.recipientName,
                                                        ticketNumber: tx.ticketNumber,
                                                        date: tx.date
                                                    }} 
                                                />
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
