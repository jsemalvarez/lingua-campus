"use client";

import { useState } from "react";
import { RegisterFeeForm } from "./RegisterFeeForm";
import { RegisterIncomeForm } from "./RegisterIncomeForm";
import { RegisterEnrollmentFeeForm } from "./RegisterEnrollmentFeeForm";
import { Wallet, ShoppingBag, GraduationCap } from "lucide-react";

interface StudentListOption {
    id: string;
    name: string;
}

interface RegisterIncomesFormProps {
    students: StudentListOption[];
}

export function RegisterIncomesForm({ students }: RegisterIncomesFormProps) {
    const [activeTab, setActiveTab] = useState<"fees" | "misc" | "enrollment">("fees");

    return (
        <div className="space-y-6">
            {/* Tabs Header */}
            <div className="flex p-1 bg-muted/50 rounded-xl gap-1">
                <button
                    onClick={() => setActiveTab("fees")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${
                        activeTab === "fees"
                            ? "bg-white dark:bg-zinc-900 text-emerald-600 shadow-sm ring-1 ring-black/5"
                            : "text-muted-foreground hover:bg-white/50 dark:hover:bg-zinc-800"
                    }`}
                >
                    <Wallet size={16} /> Cuotas
                </button>
                <button
                    onClick={() => setActiveTab("enrollment")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${
                        activeTab === "enrollment"
                            ? "bg-white dark:bg-zinc-900 text-emerald-600 shadow-sm ring-1 ring-black/5"
                            : "text-muted-foreground hover:bg-white/50 dark:hover:bg-zinc-800"
                    }`}
                >
                    <GraduationCap size={16} /> Matrícula
                </button>
                <button
                    onClick={() => setActiveTab("misc")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${
                        activeTab === "misc"
                            ? "bg-white dark:bg-zinc-900 text-emerald-600 shadow-sm ring-1 ring-black/5"
                            : "text-muted-foreground hover:bg-white/50 dark:hover:bg-zinc-800"
                    }`}
                >
                    <ShoppingBag size={16} /> Ventas
                </button>
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
            </div>
        </div>
    );
}
