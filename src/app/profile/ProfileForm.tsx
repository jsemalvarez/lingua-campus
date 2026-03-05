"use client";

import { useTransition, useState } from "react";
import { updateProfileAction } from "./actions";
import { Button } from "@/components/ui/Button";
import { UserCircle, CheckCircle, AlertCircle, Phone } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface ProfileFormProps {
    initialData: {
        name: string;
        phone: string | null;
        email: string;
        role: string;
    };
}

export function ProfileForm({ initialData }: ProfileFormProps) {
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (formData: FormData) => {
        setStatus("idle");
        startTransition(async () => {
            const result = await updateProfileAction(formData);
            if (result.success) {
                setStatus("success");
                setTimeout(() => setStatus("idle"), 4000);
            } else {
                setStatus("error");
                setErrorMsg(result.error ?? "Ocurrió un error");
            }
        });
    };

    return (
        <form action={handleSubmit} className="space-y-6">
            <div className="space-y-4">
                {/* Nombre */}
                <div className="space-y-1.5">
                    <label htmlFor="name" className="text-sm font-semibold text-foreground/80">
                        Nombre Completo
                    </label>
                    <input
                        id="name"
                        name="name"
                        defaultValue={initialData.name}
                        placeholder="Ej: Laura Martinez"
                        className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
                        required
                    />
                </div>

                {/* Celular */}
                <div className="space-y-1.5">
                    <label htmlFor="phone" className="text-sm font-semibold text-foreground/80">
                        Teléfono Celular
                    </label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <input
                            id="phone"
                            name="phone"
                            type="tel"
                            defaultValue={initialData.phone ?? ""}
                            placeholder="+54 9 11 1234-5678"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
                        />
                    </div>
                </div>

                {/* Rol e Email (Sólo lectura) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-border/50">
                    <div className="space-y-1.5 opacity-70">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
                        <div className="px-4 py-2.5 rounded-xl border border-input bg-muted/50 text-sm font-medium">
                            {initialData.email}
                        </div>
                    </div>
                    <div className="space-y-1.5 opacity-70">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rol</label>
                        <div className="px-4 py-2.5 rounded-xl border border-input bg-muted/50 text-sm font-medium">
                            {initialData.role}
                        </div>
                    </div>
                </div>
            </div>

            {/* Feedback */}
            {status === "success" && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm animate-in">
                    <CheckCircle size={16} className="shrink-0" />
                    ¡Tu perfil ha sido actualizado!
                </div>
            )}
            {status === "error" && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm animate-in">
                    <AlertCircle size={16} className="shrink-0" />
                    {errorMsg}
                </div>
            )}

            {/* Botón de Guardado */}
            <Button
                type="submit"
                className="w-full sm:w-auto mt-2 premium-gradient shadow-md shadow-primary/20"
                disabled={isPending}
            >
                {isPending ? (
                    <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                        Guardando...
                    </span>
                ) : (
                    "Guardar Cambios"
                )}
            </Button>
        </form>
    );
}
