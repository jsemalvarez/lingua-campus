"use client";

import { useState } from "react";
import { RegisterFeeForm } from "./RegisterFeeForm";
import { RegisterIncomeForm } from "./RegisterIncomeForm";
import { RegisterEnrollmentFeeForm } from "./RegisterEnrollmentFeeForm";
import { RegisterAdvanceForm } from "./RegisterAdvanceForm";
import { Wallet, ShoppingBag, GraduationCap, PlusCircle } from "lucide-react";

interface StudentListOption {
    id: string;
    name: string;
}

interface RegisterIncomesFormProps {
    students: StudentListOption[];
}

export function RegisterIncomesForm({ students }: RegisterIncomesFormProps) {
    const [activeTab, setActiveTab] = useState<"fees" | "misc" | "enrollment" | "advance">("fees");

    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="flex flex-col gap-2">
                {/* Cuotas: Full width row */}
                <button
                    onClick={() => setActiveTab("fees")}
                    className={`w-full flex items-center justify-center gap-2 py-3 text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm ${
                        activeTab === "fees"
                            ? "bg-white dark:bg-zinc-900 text-emerald-600 ring-1 ring-black/5"
                            : "bg-zinc-100/50 dark:bg-zinc-800/50 text-muted-foreground hover:bg-white/50 dark:hover:bg-zinc-800 border border-transparent"
                    }`}
                >
                    <Wallet size={18} /> Pago de Cuotas Mensuales
                </button>

                {/* Sub-options: 3 columns row */}
                <div className="grid grid-cols-3 gap-2">
                    <button
                        onClick={() => setActiveTab("enrollment")}
                        className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all border ${
                            activeTab === "enrollment"
                                ? "bg-white dark:bg-zinc-900 text-emerald-600 shadow-sm ring-1 ring-black/5 border-transparent"
                                : "bg-zinc-100/30 dark:bg-zinc-800/30 text-muted-foreground hover:bg-white/50 dark:hover:bg-zinc-800 border-border/40"
                        }`}
                    >
                        <GraduationCap size={16} /> Matrícula
                    </button>
                    <button
                        onClick={() => setActiveTab("misc")}
                        className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all border ${
                            activeTab === "misc"
                                ? "bg-white dark:bg-zinc-900 text-emerald-600 shadow-sm ring-1 ring-black/5 border-transparent"
                                : "bg-zinc-100/30 dark:bg-zinc-800/30 text-muted-foreground hover:bg-white/50 dark:hover:bg-zinc-800 border-border/40"
                        }`}
                    >
                        <ShoppingBag size={16} /> Ventas
                    </button>
                    <button
                        onClick={() => setActiveTab("advance")}
                        className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all border ${
                            activeTab === "advance"
                                ? "bg-white dark:bg-zinc-900 text-emerald-600 shadow-sm ring-1 ring-black/5 border-transparent"
                                : "bg-zinc-100/30 dark:bg-zinc-800/30 text-muted-foreground hover:bg-white/50 dark:hover:bg-zinc-800 border-border/40"
                        }`}
                    >
                        <PlusCircle size={16} /> Adelantos
                    </button>
                </div>
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeTab === "fees" && (
                    <RegisterFeeForm students={students} />
                )}
                {activeTab === "enrollment" && (
                    <RegisterEnrollmentFeeForm students={students} />
                )}
                {activeTab === "misc" && (
                    <RegisterIncomeForm students={students} />
                )}
                {activeTab === "advance" && (
                    <RegisterAdvanceForm students={students} />
                )}
            </div>
        </div>
    );
}
