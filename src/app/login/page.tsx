"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Eye, EyeOff, LogIn, AlertCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const result = await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        if (result?.error) {
            setError("Credenciales inválidas. Verificá tu email y contraseña.");
            setLoading(false);
        } else {
            // El dashboard se encarga de redirigir según el rol:
            // SUPERADMIN → /admin/institutes
            // ADMIN/TEACHER → /dashboard
            router.push("/dashboard");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative bg-background text-foreground overflow-hidden">
            {/* Controles superiores (Mobile First: toggle de tema en la esquina superior) */}
            <div className="absolute top-4 right-4 z-50">
                <ThemeToggle variant="full" />
            </div>

            {/* Background decoration (Dark mode aware) */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -right-40 w-[30rem] h-[30rem] bg-primary/10 dark:bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute -bottom-40 -left-40 w-[30rem] h-[30rem] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[100px]" />
            </div>

            {/* Login Card */}
            <Card className="max-w-md w-full p-8 shadow-2xl shadow-primary/5 border-border/40 relative glass animate-in">
                {/* Logo & Header */}
                <div className="text-center mb-8">
                    <div className="h-16 w-16 premium-gradient rounded-2xl mx-auto flex items-center justify-center text-white font-extrabold text-3xl mb-5 shadow-lg shadow-primary/30 transform transition-transform hover:scale-105">
                        L
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight">Lingua Campus</h1>
                    <p className="text-muted-foreground mt-2 text-sm font-medium">Iniciá sesión para continuar</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email */}
                    <div className="space-y-1.5">
                        <label htmlFor="email" className="text-sm font-semibold text-foreground/90">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                            className="w-full px-4 py-3 rounded-xl border border-input focus:ring-2 focus:ring-ring/30 focus:border-ring outline-none transition-all bg-background text-foreground text-sm font-medium placeholder:text-muted-foreground/50"
                            required
                            autoComplete="email"
                        />
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                            <label htmlFor="password" className="text-sm font-semibold text-foreground/90">
                                Contraseña
                            </label>
                            <a href="#" className="text-xs font-semibold text-primary hover:underline" tabIndex={-1}>
                                ¿Olvidaste tu clave?
                            </a>
                        </div>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 pr-11 rounded-xl border border-input focus:ring-2 focus:ring-ring/30 focus:border-ring outline-none transition-all bg-background text-foreground text-sm font-medium placeholder:text-muted-foreground/50"
                                required
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm font-medium animate-in">
                            <AlertCircle size={18} className="shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    <Button
                        type="submit"
                        className="w-full premium-gradient h-12 text-base font-bold shadow-md shadow-primary/20 flex items-center justify-center gap-2 mt-4 transition-all hover:shadow-primary/30"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="w-5 h-5 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                                Ingresando...
                            </>
                        ) : (
                            <>
                                <LogIn size={18} />
                                Ingresar a mi cuenta
                            </>
                        )}
                    </Button>
                </form>

                <div className="mt-8 pt-6 border-t border-border/50 text-center">
                    <p className="text-xs font-medium text-muted-foreground">
                        Lingua Campus &copy; {new Date().getFullYear()} — Todos los derechos reservados
                    </p>
                </div>
            </Card>
        </div>
    );
}
