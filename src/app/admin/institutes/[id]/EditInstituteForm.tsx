"use client";

import { useTransition, useState } from "react";
import { editInstituteAction } from "../../actions";
import { Button } from "@/components/ui/Button";
import { CheckCircle, AlertCircle } from "lucide-react";

interface EditInstituteFormProps {
    institute: {
        id: string;
        name: string;
        subdomain: string;
        phone: string | null;
        address: string | null;
        status: string;
        plan: string;
        customDomain: string | null;
        pwaIcon192: string | null;
        pwaIcon512: string | null;
    };
}

export function EditInstituteForm({ institute }: EditInstituteFormProps) {
    const [isPending, startTransition] = useTransition();
    const [statusFeedback, setStatusFeedback] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (formData: FormData) => {
        setStatusFeedback("idle");
        formData.append("id", institute.id); // Agregamos el ID oculto

        startTransition(async () => {
            const result = await editInstituteAction(formData);
            if (result.success) {
                setStatusFeedback("success");
                setTimeout(() => setStatusFeedback("idle"), 3000);
            } else {
                setStatusFeedback("error");
                setErrorMsg(result.error ?? "Error al editar instituto");
            }
        });
    };

    return (
        <form action={handleSubmit} className="space-y-5 p-6 sm:p-8">
            <h2 className="text-lg font-bold mb-4">Información del Instituto</h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-sm font-semibold">Nombre del Instituto</label>
                    <input
                        name="name"
                        defaultValue={institute.name}
                        placeholder="Ej: Oxford Institute"
                        className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-ring/30 transition-all font-medium"
                        required
                    />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-sm font-semibold">Subdominio</label>
                    <div className="flex rounded-xl overflow-hidden border border-input focus-within:ring-2 focus-within:ring-ring/30 transition-all">
                        <input
                            name="subdomain"
                            defaultValue={institute.subdomain}
                            placeholder="oxford"
                            className="w-full px-4 py-2.5 bg-background text-sm outline-none font-medium"
                            required
                        />
                        <div className="bg-muted px-4 py-2.5 text-sm text-muted-foreground flex items-center border-l border-input">
                            .linguacampus.com
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Teléfono Comercial</label>
                    <input
                        name="phone"
                        defaultValue={institute.phone ?? ""}
                        placeholder="Ej: +54 9 11..."
                        className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-ring/30 transition-all"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Plan Comercial</label>
                    <select
                        name="plan"
                        defaultValue={institute.plan}
                        className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-ring/30 transition-all appearance-none"
                    >
                        <option value="BASIC">Básico (Gestión)</option>
                        <option value="STANDARD">Estándar (Playground)</option>
                        <option value="PREMIUM">Premium (Marca Blanca)</option>
                    </select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-sm font-semibold">Dominio Personalizado (Premium)</label>
                    <input
                        name="customDomain"
                        defaultValue={institute.customDomain ?? ""}
                        placeholder="Ej: academiaoxford.com"
                        className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-ring/30 transition-all"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Ícono PWA 192px (URL)</label>
                    <input
                        name="pwaIcon192"
                        defaultValue={institute.pwaIcon192 ?? ""}
                        placeholder="https://..."
                        className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-ring/30 transition-all"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Ícono PWA 512px (URL)</label>
                    <input
                        name="pwaIcon512"
                        defaultValue={institute.pwaIcon512 ?? ""}
                        placeholder="https://..."
                        className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-ring/30 transition-all"
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold">Estado de Operación</label>
                    <select
                        name="status"
                        defaultValue={institute.status}
                        className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-ring/30 transition-all appearance-none"
                    >
                        <option value="ACTIVE">Activo</option>
                        <option value="INACTIVE">Inactivo (Suspendido)</option>
                    </select>
                </div>
            </div>

            <div className="space-y-1.5 mt-2">
                <label className="text-sm font-semibold">Dirección</label>
                <input
                    name="address"
                    defaultValue={institute.address ?? ""}
                    placeholder="Av. Principal 123, Ciudad"
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-ring/30 transition-all"
                />
            </div>

            {/* Feedback */}
            {statusFeedback === "success" && (
                <div className="flex items-center gap-2 p-3 mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-sm font-medium animate-in">
                    <CheckCircle size={16} /> Cambios guardados correctamente.
                </div>
            )}
            {statusFeedback === "error" && (
                <div className="flex items-center gap-2 p-3 mt-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-sm font-medium animate-in">
                    <AlertCircle size={16} /> {errorMsg}
                </div>
            )}

            <div className="pt-4 border-t border-border/50 flex justify-end">
                <Button type="submit" size="md" className="premium-gradient shadow-md" disabled={isPending}>
                    {isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
            </div>
        </form>
    );
}
