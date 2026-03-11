"use client";

import { useTransition, useState, useRef, useEffect } from "react";
import { createPaymentAction } from "../actions";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { CheckCircle, AlertCircle, Search, ChevronDown } from "lucide-react";

interface StudentListOption {
    id: string;
    name: string;
}

export function RegisterFeeForm({ students }: { students: StudentListOption[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    // Custom searchable dropdown state
    const [searchQuery, setSearchQuery] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<StudentListOption | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const normalizeString = (str: string) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const filteredStudents = searchQuery.trim() === ""
        ? students
        : students.filter(s => normalizeString(s.name).includes(normalizeString(searchQuery)));

    const handleSubmit = async (formData: FormData) => {
        setStatus("idle");

        if (!selectedStudent) {
            setStatus("error");
            setErrorMsg("Debes seleccionar un estudiante");
            return;
        }

        formData.append("status", "PAID");
        formData.append("studentId", selectedStudent.id);

        startTransition(async () => {
            const result = await createPaymentAction(formData);
            if (result.success) {
                setStatus("success");
                setTimeout(() => {
                    setStatus("idle");
                    setSelectedStudent(null);
                    setSearchQuery("");
                    const formEl = document.getElementById("fee-form") as HTMLFormElement;
                    if (formEl) formEl.reset();
                }, 2000);
            } else {
                setStatus("error");
                setErrorMsg(result.error ?? "No se pudo registrar el pago");
            }
        });
    };

    return (
        <form id="fee-form" action={handleSubmit} className="space-y-4">
            <h3 className="font-semibold text-lg border-b border-border/50 pb-2 mb-4 text-emerald-600 dark:text-emerald-400">Ingresar Pago de Cuota</h3>

            {/* Buscador de Estudiantes Autocompletable */}
            <div className="space-y-1.5 relative" ref={dropdownRef}>
                <label className="text-sm font-semibold">Estudiante</label>
                <div
                    className={`relative w-full min-h-[44px] px-3 py-2 rounded-lg border text-sm flex items-center justify-between transition-all cursor-text ${isDropdownOpen ? 'border-primary ring-2 ring-primary/20 bg-background' : 'border-input bg-background/50 hover:bg-background shadow-sm'}`}
                    onClick={() => setIsDropdownOpen(true)}
                >
                    <div className="flex-1 flex items-center gap-2 overflow-hidden w-full">
                        {isDropdownOpen ? (
                            <>
                                <Search size={16} className="text-muted-foreground shrink-0" />
                                <input
                                    autoFocus
                                    className="w-full bg-transparent outline-none border-none p-0 text-sm focus:ring-0 text-foreground"
                                    placeholder="Buscar por nombre..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </>
                        ) : (
                            <span className={`truncate w-full block ${selectedStudent ? "text-foreground font-bold" : "text-muted-foreground"}`}>
                                {selectedStudent ? selectedStudent.name : "🔍 Buscar un estudiante..."}
                            </span>
                        )}
                    </div>
                    <ChevronDown size={16} className={`text-muted-foreground shrink-0 ml-2 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                </div>

                {isDropdownOpen && (
                    <div className="absolute top-[calc(100%+4px)] left-0 w-full max-h-56 overflow-y-auto bg-card border border-border shadow-xl rounded-xl z-[100] animate-in fade-in slide-in-from-top-1 p-1">
                        {filteredStudents.length === 0 ? (
                            <div className="p-4 text-sm text-center text-muted-foreground">
                                No se encontraron resultados.
                            </div>
                        ) : (
                            filteredStudents.map(s => (
                                <div
                                    key={s.id}
                                    className="px-3 py-2.5 text-sm rounded-lg hover:bg-primary/10 hover:text-primary font-medium cursor-pointer transition-colors"
                                    onClick={() => {
                                        setSelectedStudent(s);
                                        setSearchQuery("");
                                        setIsDropdownOpen(false);
                                    }}
                                >
                                    {s.name}
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Monto cobrado ($)</label>
                    <input type="number" name="amount" min="1" step="0.01" required placeholder="Ej: 15000" className="w-full px-4 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none shadow-sm focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Método de Pago</label>
                    <select name="method" className="w-full px-4 py-2 rounded-lg border border-input bg-background/50 text-sm outline-none shadow-sm focus:ring-2 focus:ring-primary/20">
                        <option value="EFECTIVO">Efectivo</option>
                        <option value="TRANSFERENCIA">Transferencia</option>
                        <option value="TARJETA">Tarjeta C/D</option>
                        <option value="MERCADOPAGO">MercadoPago</option>
                        <option value="OTROS">Otros</option>
                    </select>
                </div>
            </div>

            {status === "success" && (
                <div className="flex items-center gap-2 p-3 mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-sm font-medium animate-in">
                    <CheckCircle size={16} /> Pago registrado exitosamente
                </div>
            )}

            {status === "error" && (
                <div className="flex items-center gap-2 p-3 mt-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-sm font-medium animate-in">
                    <AlertCircle size={16} /> {errorMsg}
                </div>
            )}

            <Button type="submit" className="w-full font-bold mt-2 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={isPending}>
                {isPending ? "Grabando..." : "Confirmar Ingreso (+)"}
            </Button>
        </form>
    );
}
