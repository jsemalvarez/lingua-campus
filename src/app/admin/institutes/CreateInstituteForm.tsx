"use client";

import { useTransition } from "react";
import { createInstituteAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { Building2, Plus, ShieldCheck, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";

export function CreateInstituteForm() {
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (formData: FormData) => {
        setStatus("idle");
        startTransition(async () => {
            const result = await createInstituteAction(formData);
            if (result.success) {
                setStatus("success");
                (document.getElementById("inst-form") as HTMLFormElement).reset();
                // Reset feedback después de 4s
                setTimeout(() => setStatus("idle"), 4000);
            } else {
                setStatus("error");
                setErrorMsg(result.error ?? "Error desconocido");
            }
        });
    };

    return (
        <form id="inst-form" action={handleSubmit} className="space-y-5">
            {/* Título */}
            <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Plus size={18} />
                </div>
                <h2 className="text-lg sm:text-xl font-bold">Nuevo Instituto</h2>
            </div>

            {/* ── Datos del Instituto ── */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <Building2 size={11} /> Datos del Instituto
                </h3>

                <div className="space-y-1.5">
                    <label htmlFor="instituteName" className="text-sm font-semibold">
                        Nombre del Instituto
                    </label>
                    <input
                        id="instituteName"
                        name="instituteName"
                        placeholder="Ej: Instituto Oxford"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
                        required
                    />
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="subdomain" className="text-sm font-semibold">
                        Subdominio
                        <span className="ml-1.5 text-xs font-normal text-muted-foreground">(único por instituto)</span>
                    </label>
                    <div className="flex items-center rounded-xl border border-input bg-background overflow-hidden focus-within:ring-2 focus-within:ring-ring/30 focus-within:border-ring transition-all">
                        <input
                            id="subdomain"
                            name="subdomain"
                            placeholder="oxford"
                            className="flex-1 px-3.5 py-2.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
                            required
                        />
                        <span className="px-3 text-xs text-muted-foreground bg-muted border-l border-border py-2.5 whitespace-nowrap">
                            .linguacampus.com
                        </span>
                    </div>
                </div>
            </div>

            <div className="h-px bg-border/60" />

            {/* ── Administrador Inicial ── */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                    <ShieldCheck size={11} /> Administrador Inicial
                </h3>

                <div className="space-y-1.5">
                    <label htmlFor="adminName" className="text-sm font-semibold">
                        Nombre Completo
                    </label>
                    <input
                        id="adminName"
                        name="adminName"
                        placeholder="Ej: Juan Perez"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
                        required
                    />
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="adminEmail" className="text-sm font-semibold">
                        Email de Acceso
                    </label>
                    <input
                        id="adminEmail"
                        name="adminEmail"
                        type="email"
                        placeholder="admin@instituto.com"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm placeholder:text-muted-foreground/60 outline-none focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
                        required
                    />
                </div>
            </div>

            {/* ── Feedback ── */}
            {status === "success" && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm">
                    <CheckCircle size={16} className="shrink-0" />
                    ¡Instituto y administrador creados con éxito!
                </div>
            )}
            {status === "error" && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm">
                    <AlertCircle size={16} className="shrink-0" />
                    {errorMsg}
                </div>
            )}

            {/* ── Submit ── */}
            <Button
                type="submit"
                className="w-full premium-gradient h-11 text-sm sm:text-base font-semibold shadow-md shadow-primary/20"
                disabled={isPending}
            >
                {isPending ? (
                    <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                        Procesando...
                    </span>
                ) : (
                    "Crear y Dar de Alta"
                )}
            </Button>

            <p className="text-[10px] text-center text-muted-foreground">
                La contraseña inicial del admin será:{" "}
                <code className="font-mono font-bold bg-muted px-1.5 py-0.5 rounded">admin123</code>
            </p>
        </form>
    );
}
