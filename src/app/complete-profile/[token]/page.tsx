import { getStudentByToken } from "../actions";
import { RegistrationForm } from "@/app/inscription/RegistrationForm";
import { Card } from "@/components/ui/Card";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { GraduationCap, Sparkles, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default async function CompleteProfilePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const result = await getStudentByToken(token);

    if (!result.success || !result.student || !result.institute) {
        return (
            <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] flex flex-col items-center justify-center p-4">
                <Card className="w-full max-w-md p-8 text-center space-y-6 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border-white/20 dark:border-slate-800/40 shadow-xl rounded-[2.5rem]">
                    <div className="h-20 w-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                        <AlertCircle size={40} />
                    </div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">Link Inválido</h1>
                    <p className="text-muted-foreground font-medium leading-relaxed">
                        {result.error || "El link de acceso ha expirado o ya ha sido utilizado."}
                    </p>
                    <div className="pt-4">
                        <Link href="/">
                            <Button className="premium-gradient w-full py-6 text-lg font-bold rounded-2xl">
                                Volver al Inicio
                            </Button>
                        </Link>
                    </div>
                </Card>
            </div>
        );
    }

    const { student, institute, instituteLevels } = result;

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] selection:bg-primary/20 relative overflow-x-hidden">
            <PublicNavbar instituteName={institute.name} landingUrl="/" />

            {/* ── Fondo Decorativo Animado ── */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/20 dark:bg-primary/30 rounded-full blur-[120px] animate-pulse duration-[10s]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-500/20 dark:bg-emerald-500/30 rounded-full blur-[120px] animate-pulse duration-[8s] delay-1000" />
            </div>

            <div className="relative z-10 container mx-auto px-4 py-8 md:py-16 flex flex-col items-center">
                {/* ── Header del Instituto ── */}
                <header className="text-center mb-10 animate-in fade-in zoom-in-95 duration-1000">
                    <div className="inline-flex items-center justify-center p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-xl mb-6 border border-border/50">
                        <GraduationCap className="text-primary w-10 h-10" />
                    </div>
                    
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white drop-shadow-sm flex items-center justify-center gap-3">
                        <Sparkles className="text-primary w-8 h-8 hidden md:block opacity-50" />
                        ¡Hola, {student.name.split(' ')[0]}!
                        <Sparkles className="text-primary w-8 h-8 hidden md:block opacity-50" />
                    </h1>
                    
                    <p className="text-xl font-medium text-muted-foreground max-w-2xl mx-auto">
                        Por favor, completá tu ficha de inscripción para <strong>{institute.name}</strong> para asegurar que tengamos todos tus datos actualizados.
                    </p>

                    <div className="mt-8 flex items-center justify-center gap-2">
                        <span className="px-4 py-1.5 bg-primary/10 text-primary text-xs font-black uppercase tracking-widest rounded-full border border-primary/20">
                            Actualización de Perfil
                        </span>
                    </div>
                </header>

                {/* ── Contenedor del Formulario ── */}
                <Card className="w-full max-w-4xl p-1 md:p-2 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border-white/20 dark:border-slate-800/40 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] rounded-[2.5rem] overflow-hidden">
                    <div className="bg-white/80 dark:bg-slate-900/80 p-6 md:p-12 rounded-[2rem] border border-white/40 dark:border-slate-800/20">
                        <RegistrationForm 
                            instituteId={institute.id} 
                            instituteName={institute.name} 
                            instituteLevels={instituteLevels}
                            initialData={student}
                            token={token}
                            studentName={student.name}
                        />
                    </div>
                </Card>

                {/* ── Footer ── */}
                <footer className="mt-16 text-center space-y-4 opacity-50 hover:opacity-100 transition-opacity pb-10">
                    <div className="flex items-center justify-center gap-4">
                        <div className="h-[1px] w-8 bg-border" />
                        <p className="text-[10px] font-black tracking-[0.3em] uppercase">
                            Sitio Seguro • {institute.name}
                        </p>
                        <div className="h-[1px] w-8 bg-border" />
                    </div>
                </footer>
            </div>
        </div>
    );
}
