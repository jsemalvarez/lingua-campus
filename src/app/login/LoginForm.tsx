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
    const [password, setPassword]     = useState("");
    const [error, setError]           = useState("");
    const [loading, setLoading]       = useState(false);
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
        <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-12 bg-white dark:bg-slate-950 transition-colors duration-500 overflow-hidden relative">
             {/* Decorative background gradients from Landing Page */}
             <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-950/20 pointer-events-none" />
             <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full bg-violet-400/20 dark:bg-violet-600/15 blur-[120px] pointer-events-none animate-pulse-slow" />
             <div className="absolute top-40 -left-40 w-[500px] h-[500px] rounded-full bg-indigo-400/20 dark:bg-indigo-600/15 blur-[120px] pointer-events-none animate-pulse-slow" style={{ animationDelay: '1s' }} />

             {/* Controles superiores */}
             <div className="absolute top-4 right-4 z-50">
                 <ThemeToggle variant="full" />
             </div>
 
             {/* Main Wrapper: Centered flex container for the two cards */}
             <div className="relative flex flex-col lg:flex-row items-center justify-center lg:items-stretch z-10">
                 
                 {/* Mobile Illustration (Top overlap on mobile) */}
                 <div className="lg:hidden w-full max-w-[320px] h-[320px] bg-slate-900 rounded-[3rem] shadow-2xl flex items-center justify-center mb-[-60px] overflow-hidden relative z-20">
                     <Image
                         src="/login-mobile.png"
                         alt="Lingua Campus Mobile"
                         fill
                         priority
                         className="object-cover drop-shadow-2xl animate-pulse-slow"
                     />
                 </div>

                   {/* Left Card: Form (Shorter and wider) */}
                 <div className="w-full sm:w-[640px] lg:h-[500px] bg-white/40 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[3.5rem] border border-slate-200/50 dark:border-white/10 shadow-2xl shadow-indigo-500/30 dark:shadow-[0_0_50px_-12px_rgba(255,255,255,0.2)] p-10 sm:px-16 sm:py-16 lg:pr-32 flex flex-col justify-center z-10 lg:-mr-20 animate-in self-center">
                     <div className="mb-10 text-center">
                         <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                             {brandName}
                         </h1>
                         <p className="text-slate-600 dark:text-slate-400 font-bold text-xl opacity-80">
                             Iniciar Sesión
                         </p>
                     </div>
 
                     <form onSubmit={handleSubmit} className="space-y-8">
                         {/* Email / Username */}
                         <div className="relative group">
                             <div className="flex items-center justify-between mb-1">
                                 <label htmlFor="identifier" className="block text-lg font-bold text-slate-800 dark:text-slate-200 ml-1">
                                     Email o DNI
                                 </label>
                             </div>
                             <div className="relative">
                                 <input
                                     id="identifier"
                                     type="text"
                                     value={identifier}
                                     onChange={(e) => setIdentifier(e.target.value)}
                                     className="w-full bg-transparent border-b-2 border-slate-900/20 dark:border-white/20 focus:border-indigo-600 dark:focus:border-white py-2 pr-10 outline-none transition-all text-slate-900 dark:text-white font-medium text-xl"
                                     required
                                     disabled={loading || !isOnline}
                                 />
                                 <div className="absolute right-0 bottom-2 text-slate-900 dark:text-white">
                                     <User size={24} />
                                 </div>
                             </div>
                         </div>
 
                         {/* Password */}
                         <div className="relative group">
                             <div className="flex items-center justify-between mb-1">
                                 <label htmlFor="password" className="block text-lg font-bold text-slate-800 dark:text-slate-200 ml-1">
                                     Contraseña
                                 </label>
                             </div>
                             <div className="relative">
                                 <input
                                     id="password"
                                     type={showPassword ? "text" : "password"}
                                     value={password}
                                     onChange={(e) => setPassword(e.target.value)}
                                     className="w-full bg-transparent border-b-2 border-slate-900/20 dark:border-white/20 focus:border-indigo-600 dark:focus:border-white py-2 pr-10 outline-none transition-all text-slate-900 dark:text-white font-medium text-xl"
                                     required
                                     disabled={loading || !isOnline}
                                 />
                                 <button
                                     type="button"
                                     onClick={() => setShowPassword(!showPassword)}
                                     className="absolute right-0 bottom-2 text-slate-900 dark:text-white hover:opacity-100 transition-opacity"
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
                         <div className="pt-6">
                             <Button
                                 type="submit"
                                 className="w-full h-16 rounded-full bg-gradient-to-r from-slate-800 to-slate-950 hover:from-black hover:to-slate-800 text-white font-bold text-2xl shadow-2xl shadow-indigo-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center"
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
 
                     <div className="mt-8 text-right">
                         <button className="text-slate-700 dark:text-slate-400 font-bold text-base hover:underline opacity-80">
                             ¿Olvidaste tu contraseña?
                         </button>
                     </div>
                 </div>
 
                 {/* Right Card: Illustration (Taller, wider, and z-indexed) */}
                 <div className="hidden lg:flex w-[540px] h-[720px] bg-slate-900 dark:bg-black rounded-[4.5rem] shadow-2xl shadow-indigo-500/30 dark:shadow-[0_0_60px_-15px_rgba(255,255,255,0.2)] items-center justify-center relative overflow-hidden group z-20 self-center">
                     {/* Overlay Glow */}
                     <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-transparent pointer-events-none" />
                     
                     {/* Notebook Illustration */}
                     <div className="relative w-full h-full">
                         <Image
                             src="/login-desktop.png"
                             alt="Lingua Campus Desktop"
                             fill
                             priority
                             className="object-cover transition-transform duration-1000 group-hover:scale-110"
                         />
                     </div>
 
                     {/* Dynamic Branding */}
                     {institute?.logoUrl && (
                         <div className="absolute top-12 right-12 w-20 h-20 rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-white/10 backdrop-blur-md p-3">
                             <Image 
                                 src={institute.logoUrl} 
                                 alt={brandName}
                                 width={80}
                                 height={80}
                                 className="object-contain w-full h-full"
                             />
                         </div>
                     )}
                 </div>
             </div>
        </div>
    );
}
