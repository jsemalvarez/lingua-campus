"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { ArrowLeft, MailCheck, Send, Info } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { requestPasswordResetAction } from "./actions";

interface ForgotPasswordFormProps {
    institute?: {
        id: string;
        name: string;
        logoUrl: string | null;
    } | null;
}

export default function ForgotPasswordForm({ institute }: ForgotPasswordFormProps) {
    const [identifier, setIdentifier] = useState("");
    const [loading, setLoading] = useState(false);
    const [enviado, setEnviado] = useState(false);

    const isOnline = useOnlineStatus();

    const brandName = institute ? institute.name : "Lingua Campus";
    const primaryColor = "#4F46E5";

    /**
     * Si lo que escribió no es un correo, es un alumno entrando con su DNI.
     *
     * La respuesta del servidor es siempre la misma —"si está registrado, te
     * llega un correo"—, y para un chico que puso su DNI eso significa quedarse
     * esperando un mail que no va a llegar nunca, sin entender por qué. Se
     * distingue por la forma de lo tipeado, que no consulta nada ni revela nada:
     * un DNI no tiene arroba.
     */
    const pareceDni = identifier.trim().length > 0 && !identifier.includes("@");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isOnline || pareceDni) return;

        setLoading(true);

        const formData = new FormData();
        formData.append("identifier", identifier);
        await requestPasswordResetAction(formData);

        setLoading(false);
        setEnviado(true);
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative bg-background text-foreground overflow-hidden">
            <div className="absolute top-4 right-4 z-50">
                <ThemeToggle variant="full" />
            </div>

            {/* Background decoration */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -right-40 w-[30rem] h-[30rem] bg-primary/10 dark:bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute -bottom-40 -left-40 w-[30rem] h-[30rem] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[100px]" />
            </div>

            <Card className="max-w-md w-full p-8 shadow-2xl shadow-primary/5 border-border/40 relative glass animate-in">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    {institute?.logoUrl ? (
                        <div className="h-16 w-16 mx-auto mb-5 rounded-2xl flex-shrink-0 shadow-lg border border-slate-200 dark:border-slate-800 bg-white overflow-hidden relative">
                            <Image
                                src={institute.logoUrl}
                                alt={`Logo de ${brandName}`}
                                fill
                                sizes="64px"
                                className="object-cover"
                            />
                        </div>
                    ) : (
                        <div
                            className={`h-16 w-16 rounded-2xl mx-auto flex items-center justify-center text-white font-extrabold text-3xl mb-5 shadow-lg shadow-primary/30 ${!institute ? "premium-gradient" : ""}`}
                            style={institute ? { backgroundColor: primaryColor } : {}}
                        >
                            {institute ? institute.name.charAt(0).toUpperCase() : "L"}
                        </div>
                    )}

                    <h1 className="text-3xl font-extrabold tracking-tight">Recuperar contraseña</h1>
                    <p className="text-muted-foreground mt-2 text-sm font-medium">
                        {enviado
                            ? "Revisá tu correo"
                            : "Te mandamos un enlace para elegir una nueva"}
                    </p>
                </div>

                {enviado ? (
                    <div className="space-y-6">
                        <div className="flex flex-col items-center text-center gap-4 p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
                            <div className="h-14 w-14 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                <MailCheck size={28} />
                            </div>
                            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 leading-relaxed">
                                Si <strong className="break-all">{identifier.trim()}</strong> está registrado, en un rato
                                vas a recibir un correo con el enlace. Vence en una hora y se usa una sola vez.
                            </p>
                        </div>

                        <p className="text-xs text-center text-muted-foreground font-medium leading-relaxed">
                            ¿No llegó? Fijate en la carpeta de correo no deseado, o volvé a pedirlo en unos minutos.
                        </p>

                        <Link href="/login" className="block">
                            <Button variant="outline" className="w-full h-12 font-bold flex items-center justify-center gap-2">
                                <ArrowLeft size={18} />
                                Volver al inicio de sesión
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-1.5">
                            <label htmlFor="identifier" className="text-sm font-semibold text-foreground/90">
                                Correo electrónico
                            </label>
                            <input
                                id="identifier"
                                type="text"
                                value={identifier}
                                onChange={(e) => setIdentifier(e.target.value)}
                                placeholder="tu@email.com"
                                className="w-full px-4 py-3 rounded-xl border border-input focus:ring-2 focus:ring-ring/30 focus:border-ring outline-none transition-all bg-background text-foreground text-sm font-medium placeholder:text-muted-foreground/50 disabled:opacity-50"
                                required
                                autoComplete="username"
                                autoFocus
                                disabled={!isOnline || loading}
                            />
                        </div>

                        {pareceDni && (
                            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-sm font-medium animate-in">
                                <Info size={18} className="shrink-0 mt-0.5" />
                                <p className="leading-relaxed">
                                    Si sos alumno y entrás con tu DNI, todavía no podés recuperarla por acá:
                                    pedile al instituto que te la restablezca.
                                </p>
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full premium-gradient h-12 text-base font-bold shadow-md shadow-primary/20 flex items-center justify-center gap-2 mt-4 transition-all hover:shadow-primary/30 disabled:opacity-70 disabled:grayscale-[0.5]"
                            disabled={loading || !isOnline || pareceDni}
                        >
                            {loading ? (
                                <>
                                    <span className="w-5 h-5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send size={18} />
                                    Enviarme el enlace
                                </>
                            )}
                        </Button>

                        <Link
                            href="/login"
                            className="flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors pt-2"
                        >
                            <ArrowLeft size={14} />
                            Volver al inicio de sesión
                        </Link>
                    </form>
                )}

                <div className="mt-8 pt-6 border-t border-border/50 text-center">
                    <p className="text-xs font-medium text-muted-foreground">
                        {brandName} &copy; {new Date().getFullYear()}
                    </p>
                </div>
            </Card>
        </div>
    );
}
