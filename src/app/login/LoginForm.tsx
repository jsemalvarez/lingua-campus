"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Eye, EyeOff, User, AlertCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useOnlineStatus } from "@/hooks/use-online-status";

interface LoginFormProps {
    institute?: {
        id: string;
        name: string;
        logoUrl: string | null;
    } | null;
}

export default function LoginForm({ institute }: LoginFormProps) {
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    const isOnline = useOnlineStatus();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isOnline) {
            setError("No tienes conexión a internet.");
            return;
        }

        setLoading(true);
        setError("");

        const result = await signIn("credentials", {
            identifier,
            password,
            instituteId: institute?.id ?? "",
            redirect: false,
        });

        if (result?.error) {
            setError("Credenciales inválidas. Verificá tu email, DNI o contraseña.");
            setLoading(false);
        } else {
            router.push("/dashboard");
        }
    };

    const brandName = institute ? institute.name : "Lingua Campus";

    return (
        // Contenedor principal
        <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-12 lg:p-8 xl:p-12 transition-colors duration-700 relative">
            {/* Fondo fijo para cubrir toda la pantalla, incluyendo el padding del body en mobile */}
            <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-sky-200 to-blue-950 dark:from-sky-600 dark:via-blue-950/40 dark:to-sky-400 z-[-1]" />
            {/* Decorative background gradients from Landing Page */}
            {/* <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-950/20 pointer-events-none" /> */}
            {/* <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-violet-400/20 dark:bg-violet-600/15 blur-[120px] pointer-events-none animate-pulse-slow" /> */}
            {/* <div className="absolute top-40 -left-40 w-[500px] h-[500px] rounded-full bg-indigo-400/20 dark:bg-indigo-600/15 blur-[120px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '1s' }} /> */}

            {/* Controles superiores */}
            <div className="absolute top-4 right-4 z-50">
                <ThemeToggle variant="full" />
            </div>

            {/* Main Wrapper: Centered flex container for the two cards */}
            <div className="relative flex flex-col lg:flex-row items-center justify-center lg:items-stretch z-10">

                {/* Mobile Illustration (Top overlap on mobile) */}
                {/* <div className="lg:hidden w-[200px] h-[200px] bg-slate-900 rounded-[2rem] shadow-2xl flex items-center justify-center mb-[-50px] overflow-hidden relative z-20 mt-4 mx-auto">
                    <Image
                        src="/login-mobile-blue-1.png"
                        alt="Lingua Campus Mobile"
                        fill
                        priority
                        className="object-cover drop-shadow-2xl animate-pulse-slow"
                    />
                </div> */}

                {/* Left Card: Form (Shorter and wider) */}
                <div className="w-full sm:max-w-[480px] lg:w-[460px] xl:w-[560px] 2xl:w-[640px] lg:h-[480px] xl:h-[520px] 2xl:h-[550px] bg-gradient-to-r from-blue-900/40 to-sky-100/40 dark:from-sky-950/40 dark:to-sky-400/40 rounded-[2rem] sm:rounded-[3.5rem] border border-white/60 dark:border-sky-400/60 shadow-[0_0_50px_rgba(255,255,255,0.7)] dark:shadow-xl dark:shadow-sky-400/60 px-6 pt-20 pb-10 sm:px-12 sm:py-12 lg:pr-24 xl:pr-28 2xl:pr-32 flex flex-col justify-center z-10 lg:-mr-16 xl:-mr-20 2xl:-mr-20 animate-in self-center transition-colors">
                    <div className="mb-10 text-center">
                        <h1 className="text-3xl sm:text-4xl font-black bg-clip-text text-transparent bg-gradient-to-b from-sky-600 to-blue-950 dark:from-white dark:to-sky-400 mb-2 tracking-tight">
                            {brandName}
                        </h1>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email / Username */}
                        <div className="relative group">
                            <div className="flex items-center justify-between">
                                <label htmlFor="identifier" className="block text-sm font-bold text-blue-950 dark:text-slate-200 ml-1">
                                    Email o DNI
                                </label>
                            </div>
                            <div className="relative">
                                <input
                                    id="identifier"
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    className="w-full bg-transparent border-b-2 border-slate-900/20 dark:border-white/20 focus:border-white/70 dark:focus:border-white/70 py-2 pr-10 outline-none transition-all text-slate-900 dark:text-white font-medium"
                                    required
                                    disabled={loading || !isOnline}
                                />
                                <div className="absolute right-0 bottom-2 text-blue-950 dark:text-white">
                                    <User size={24} />
                                </div>
                            </div>
                        </div>

                        {/* Password */}
                        <div className="relative group">
                            <div className="flex items-center justify-between">
                                <label htmlFor="password" className="block text-sm font-bold text-blue-950 dark:text-slate-200 ml-1">
                                    Contraseña
                                </label>
                            </div>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-transparent border-b-2 border-slate-900/20 dark:border-white/20 focus:border-white/70 dark:focus:border-white/70 py-2 pr-10 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 transition-all text-slate-900 dark:text-white font-medium"
                                    required
                                    disabled={loading || !isOnline}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-0 bottom-2 text-blue-950 dark:text-white hover:opacity-100 transition-opacity"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                                </button>
                            </div>
                        </div>

                        {/* Error message */}
                        {error && (
                            <div className="flex items-center gap-2 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-bold animate-in">
                                <AlertCircle size={18} className="shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-2">
                            <Button
                                type="submit"
                                className="w-full py-3 sm:py-4 rounded-xl sm:rounded-full bg-gradient-to-b from-sky-600 to-blue-950 dark:from-blue-950 dark:to-sky-500 text-white font-bold text-lg sm:text-xl shadow-xl shadow-sky-900/30 dark:shadow-sky-500/20 disabled:opacity-50 flex items-center justify-center transition-all hover:brightness-110"
                                disabled={loading || !isOnline}
                            >
                                {loading ? (
                                    <span className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    "Iniciar Sesión"
                                )}
                            </Button>
                        </div>
                    </form>

                    <div className="mt-2 text-right">
                        <button className="text-xs text-slate-700 dark:text-sky-400 font-bold text-base hover:underline opacity-80">
                            ¿Olvidaste tu contraseña?
                        </button>
                    </div>
                </div>

                {/* Right Card: Illustration (Taller, wider, and z-indexed) */}
                <div className="hidden lg:flex lg:w-[480px] lg:h-[520px] xl:w-[600px] xl:h-[560px] 2xl:w-[700px] 2xl:h-[600px] bg-slate-900 dark:bg-slate-950 border border-white/10 dark:border-sky-400/60 rounded-[4.5rem] shadow-2xl shadow-sky-500/30 dark:shadow-sky-400/60 items-center justify-center relative overflow-hidden group z-20 self-center">
                    {/* Overlay Glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent pointer-events-none" />

                    {/* Notebook Illustration */}
                    <div className="relative w-full h-full">
                        <Image
                            src="/login-desktop-blue-1.png"
                            alt="Lingua Campus Desktop"
                            fill
                            priority
                            className="object-cover transition-transform duration-1000 group-hover:scale-110"
                        />
                    </div>

                    {/* Dynamic Branding */}
                    {/* {institute?.logoUrl && (
                        <div className="absolute top-12 right-12 w-20 h-20 rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-white/10 backdrop-blur-md p-3">
                            <Image
                                src={institute.logoUrl}
                                alt={brandName}
                                width={80}
                                height={80}
                                className="object-contain w-full h-full"
                            />
                        </div>
                    )} */}
                </div>
            </div>
        </div>
    );
}
