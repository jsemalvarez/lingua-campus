"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Eye, EyeOff, KeyRound, AlertCircle, PartyPopper } from "lucide-react";
import { resetPasswordAction } from "../actions";

interface ResetPasswordFormProps {
    token: string;
    /**
     * De quién es la contraseña que se está por cambiar.
     *
     * Hoy es siempre quien recibió el correo, y decirlo parece de más. Cuando
     * entren los alumnos deja de serlo: el correo le llega al tutor, que puede
     * tener dos hijos en el instituto y dos correos casi iguales en la bandeja.
     * Sin el nombre a la vista, le cambia la contraseña al hermano equivocado.
     */
    subjectName: string;
    brandName: string;
}

export default function ResetPasswordForm({ token, subjectName, brandName }: ResetPasswordFormProps) {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [listo, setListo] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData();
        formData.append("newPassword", newPassword);
        formData.append("confirmPassword", confirmPassword);

        const result = await resetPasswordAction(token, formData);

        if (result.success) {
            setListo(true);
        } else {
            setError(result.error);
            setLoading(false);
        }
    };

    if (listo) {
        return (
            <div className="text-center space-y-6">
                <div className="h-16 w-16 rounded-2xl mx-auto flex items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <PartyPopper size={32} />
                </div>

                <div className="space-y-2">
                    <h1 className="text-2xl font-extrabold tracking-tight">Contraseña cambiada</h1>
                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                        Ya podés entrar a {brandName} con la nueva.
                    </p>
                </div>

                <Link href="/login" className="block pt-2">
                    <Button className="premium-gradient w-full h-12 font-bold">Iniciar sesión</Button>
                </Link>
            </div>
        );
    }

    return (
        <>
            <div className="text-center mb-8">
                <div className="h-16 w-16 rounded-2xl mx-auto flex items-center justify-center bg-primary/10 text-primary mb-5">
                    <KeyRound size={30} />
                </div>

                <h1 className="text-2xl font-extrabold tracking-tight">Elegí una contraseña nueva</h1>
                <p className="text-muted-foreground mt-2 text-sm font-medium">
                    Para la cuenta de <strong className="text-foreground">{subjectName}</strong>
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1.5">
                    <label htmlFor="newPassword" className="text-sm font-semibold text-foreground/90">
                        Nueva contraseña
                    </label>
                    <div className="relative">
                        <input
                            id="newPassword"
                            type={showPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Al menos 6 caracteres"
                            className="w-full px-4 py-3 pr-11 rounded-xl border border-input focus:ring-2 focus:ring-ring/30 focus:border-ring outline-none transition-all bg-background text-foreground text-sm font-medium placeholder:text-muted-foreground/50 disabled:opacity-50"
                            required
                            minLength={6}
                            autoComplete="new-password"
                            autoFocus
                            disabled={loading}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                            tabIndex={-1}
                            disabled={loading}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground/90">
                        Repetila
                    </label>
                    <input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-4 py-3 rounded-xl border border-input focus:ring-2 focus:ring-ring/30 focus:border-ring outline-none transition-all bg-background text-foreground text-sm font-medium placeholder:text-muted-foreground/50 disabled:opacity-50"
                        required
                        minLength={6}
                        autoComplete="new-password"
                        disabled={loading}
                    />
                </div>

                {error && (
                    <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm font-medium animate-in">
                        <AlertCircle size={18} className="shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <Button
                    type="submit"
                    className="w-full premium-gradient h-12 text-base font-bold shadow-md shadow-primary/20 flex items-center justify-center gap-2 mt-4 transition-all hover:shadow-primary/30 disabled:opacity-70 disabled:grayscale-[0.5]"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <span className="w-5 h-5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                            Guardando...
                        </>
                    ) : (
                        <>
                            <KeyRound size={18} />
                            Guardar contraseña
                        </>
                    )}
                </Button>
            </form>
        </>
    );
}
