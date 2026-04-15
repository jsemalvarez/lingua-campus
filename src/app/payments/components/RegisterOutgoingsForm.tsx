"use client";

import { useState } from "react";
import { RegisterSalaryForm } from "./RegisterSalaryForm";
import { RegisterExpenseForm } from "./RegisterExpenseForm";
import { UserCircle, Receipt } from "lucide-react";

interface UserInfo {
    id: string;
    name: string;
    role: string;
}

interface RegisterOutgoingsFormProps {
    employees: UserInfo[];
}

export function RegisterOutgoingsForm({ employees }: RegisterOutgoingsFormProps) {
    const [activeTab, setActiveTab] = useState<"salary" | "expense">("salary");

    return (
        <div className="space-y-6">
            {/* Tabs Header */}
            <div className="flex p-1 bg-muted/50 rounded-xl gap-1">
                <button
                    onClick={() => setActiveTab("salary")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${
                        activeTab === "salary"
                            ? "bg-white dark:bg-zinc-900 text-rose-600 shadow-sm ring-1 ring-black/5"
                            : "text-muted-foreground hover:bg-white/50 dark:hover:bg-zinc-800"
                    }`}
                >
                    <UserCircle size={16} /> Sueldos
                </button>
                <button
                    onClick={() => setActiveTab("expense")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${
                        activeTab === "expense"
                            ? "bg-white dark:bg-zinc-900 text-rose-600 shadow-sm ring-1 ring-black/5"
                            : "text-muted-foreground hover:bg-white/50 dark:hover:bg-zinc-800"
                    }`}
                >
                    <Receipt size={16} /> Otros Gastos
                </button>
            </div>

            {/* Tab Content */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeTab === "salary" ? (
                    <RegisterSalaryForm employees={employees} />
                ) : (
                    <RegisterExpenseForm />
                )}
            </div>
        </div>
    );
}
