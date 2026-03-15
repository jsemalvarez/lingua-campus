import prisma from "@/lib/prisma";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { RegistrationForm } from "./RegistrationForm";
import { GraduationCap, MapPin, Globe, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { PublicNavbar } from "@/components/layout/PublicNavbar";

export default async function InscriptionPage() {
    const headersList = await headers();
    const host = headersList.get("host") || "";

    // ── Detección de Instituto ──
    let institute;
    if (host.includes("localhost") || host.includes("127.0.0.1")) {
        institute = await prisma.institute.findFirst();
    } else {
        const subdomain = host.split(".")[0];
        institute = await prisma.institute.findFirst({
            where: {
                OR: [
                    { subdomain: subdomain },
                    { customDomain: host }
                ]
            }
        });
    }

    if (!institute) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] selection:bg-primary/20 relative overflow-x-hidden">
            <PublicNavbar instituteName={institute.name} landingUrl="/" />

            {/* ── Fondo Decorativo Animado (Mesh Gradients Intensificados) ── */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                {/* Blobs Principales */}
                <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/20 dark:bg-primary/30 rounded-full blur-[120px] animate-pulse duration-[10s]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-emerald-500/20 dark:bg-emerald-500/30 rounded-full blur-[120px] animate-pulse duration-[8s] delay-1000" />
                
                {/* Blobs Secundarios para mayor color */}
                <div className="absolute top-[20%] right-[-5%] w-[40%] h-[40%] bg-violet-500/15 dark:bg-violet-500/25 rounded-full blur-[100px] animate-bounce-slow delay-500" />
                <div className="absolute middle-left w-[35%] h-[35%] bg-rose-500/10 dark:bg-rose-500/20 rounded-full blur-[100px] animate-pulse duration-[12s]" style={{ top: '40%', left: '-5%' }} />
                
                <div className="absolute top-[10%] left-[30%] w-[25%] h-[25%] bg-blue-500/10 dark:bg-blue-300/15 rounded-full blur-[80px] animate-float" />
                
                {/* Patrón de puntos sutil */}
                <div className="absolute inset-0 opacity-[0.05] dark:opacity-[0.1]" 
                    style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '40px 40px' }} 
                />
            </div>

            <div className="relative z-10 container mx-auto px-4 py-8 md:py-16 flex flex-col items-center">
                {/* ── Header del Instituto ── */}
                <header className="text-center mb-10 animate-in fade-in zoom-in-95 duration-1000">
                    <div className="inline-flex items-center justify-center p-3 bg-white dark:bg-slate-900 rounded-2xl shadow-xl mb-6 border border-border/50 animate-bounce-slow">
                        <GraduationCap className="text-primary w-10 h-10" />
                    </div>
                    
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white drop-shadow-sm flex items-center justify-center gap-3">
                        <Sparkles className="text-primary w-8 h-8 hidden md:block opacity-50" />
                        Inscripciones a {institute.name}
                        <Sparkles className="text-primary w-8 h-8 hidden md:block opacity-50" />
                    </h1>
                    
                    <div className="flex flex-wrap items-center justify-center gap-6 text-muted-foreground font-medium">
                        <span className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-default">
                            <MapPin size={18} className="text-primary" /> {institute.address || "Sede Central"}
                        </span>
                        <span className="flex items-center gap-1.5 hover:text-primary transition-colors cursor-default">
                            <Globe size={18} className="text-primary" /> Inscripción Online
                        </span>
                    </div>
                </header>

                {/* ── Contenedor del Formulario con Glassmorphism Mejorado ── */}
                <Card className="w-full max-w-4xl p-1 md:p-2 bg-white/40 dark:bg-slate-900/40 backdrop-blur-2xl border-white/20 dark:border-slate-800/40 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] rounded-[2.5rem] overflow-hidden group">
                    <div className="bg-white/80 dark:bg-slate-900/80 p-6 md:p-12 rounded-[2rem] border border-white/40 dark:border-slate-800/20">
                        <RegistrationForm instituteId={institute.id} instituteName={institute.name} />
                    </div>
                </Card>

                {/* ── Footer de Confianza ── */}
                <footer className="mt-16 text-center space-y-4 opacity-70 hover:opacity-100 transition-opacity">
                    <p className="text-sm text-muted-foreground max-w-md">
                        Unite a nuestra comunidad educativa. Al inscribirse, su lugar queda reservado sujeto a disponibilidad y confirmación administrativa.
                    </p>
                    <div className="flex items-center justify-center gap-4 grayscale hover:grayscale-0 transition-all duration-500">
                        <div className="h-0.5 w-12 bg-border" />
                        <div className="px-3 py-1 bg-muted rounded-full text-[10px] font-bold tracking-widest uppercase">
                            Lingua Campus
                        </div>
                        <div className="h-0.5 w-12 bg-border" />
                    </div>
                </footer>
            </div>
        </div>
    );
}
