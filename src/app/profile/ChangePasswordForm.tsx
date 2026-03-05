"use client";

import { useState, useTransition } from "react";
import { changePasswordAction } from "./actions";
import { Button } from "@/components/ui/Button";
import { Lock, CheckCircle, AlertCircle } from "lucide-react";

export function ChangePasswordForm() {
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatus("idle");

        const form = e.currentTarget;
        const formData = new FormData(form);

        const currentPassword = formData.get("currentPassword") as string;
        const newPassword = formData.get("newPassword") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (newPassword !== confirmPassword) {
            setStatus("error");
            setErrorMsg("Las nuevas contraseñas no coinciden.");
            return;
        }

        if (newPassword.length < 6) {
            setStatus("error");
            setErrorMsg("La nueva contraseña debe tener al menos 6 caracteres.");
            return;
        }

        startTransition(async () => {
            const result = await changePasswordAction(formData);
            if (result.success) {
                setStatus("success");
                form.reset();
                setTimeout(() => setStatus("idle"), 5000);
            } else {
                setStatus("error");
                setErrorMsg(result.error ?? "Ocurrió un error");
            }
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6 mt-8 border-t border-border/40 pt-8">
            <div>
                <h3 className="text-xl font-bold flex items-center gap-2 mb-1">
                    <Lock className="text-primary size-5" /> Seguridad de la cuenta
                </h3>
                <p className="text-sm text-muted-foreground mb-6">Actualiza tu contraseña periódicamente para mantener tu cuenta segura.</p>
            </div>

            <div className="space-y-4">
                <div className="space-y-1.5 focus-within:text-primary transition-colors">
                    <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Contraseña actual</label>
                    <input
                        type="password"
                        name="currentPassword"
                        required
                        placeholder="Ingresa tu contraseña actual"
                        className="w-full px-4 py-3 rounded-xl border border-input/60 bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all focus:border-primary"
                    />
                </div>

                <div className="space-y-1.5 focus-within:text-primary transition-colors">
                    <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Nueva contraseña</label>
                    <input
                        type="password"
                        name="newPassword"
                        required
                        minLength={6}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full px-4 py-3 rounded-xl border border-input/60 bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all focus:border-primary"
                    />
                </div>

                <div className="space-y-1.5 focus-within:text-primary transition-colors">
                    <label className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Confirmar nueva contraseña</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        required
                        minLength={6}
                        placeholder="Repite la nueva contraseña"
                        className="w-full px-4 py-3 rounded-xl border border-input/60 bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all focus:border-primary"
                    />
                </div>
            </div>

            {status === "success" && (
                <div className="flex items-center gap-2 p-4 mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-sm font-medium animate-in slide-in-from-bottom-2">
                    <CheckCircle size={18} /> ¡Contraseña actualizada con éxito!
                </div>
            )}
            {status === "error" && (
                <div className="flex items-center gap-2 p-4 mt-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-sm font-medium animate-in slide-in-from-bottom-2">
                    <AlertCircle size={18} /> {errorMsg}
                </div>
            )}

            <div className="pt-2 flex justify-end">
                <Button type="submit" disabled={isPending} className="premium-gradient font-bold px-8 shadow-md">
                    {isPending ? "Actualizando..." : "Cambiar Contraseña"}
                </Button>
            </div>
        </form>
    );
}
