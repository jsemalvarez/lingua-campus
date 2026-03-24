"use client";

import Link from "next/link";
import Image from "next/image";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useTenant } from "@/components/providers/TenantProvider";

export default function NotFound() {
    const tenant = useTenant();
    const brandName = tenant?.name ?? "Lingua Campus";

    return (
        <div className="min-h-screen bg-background flex flex-col">
            {/* Navbar mínimo */}
            <nav className="sticky top-0 z-50 glass border-b border-border/50 px-6 flex h-14 items-center justify-between">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="h-7 w-7 premium-gradient rounded-lg flex items-center justify-center text-white font-bold text-sm group-hover:scale-105 transition-transform">
                        {brandName.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-foreground/90">{brandName}</span>
                </Link>
                <ThemeToggle variant="icon" />
            </nav>

            {/* Decoración de fondo */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[10%] left-[20%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-accent/10 rounded-full blur-[100px]" />
            </div>

            {/* Contenido central */}
            <main className="flex-1 flex items-center justify-center px-4">
                <div className="text-center max-w-lg animate-in fade-in-up">

                    {/* Ilustración */}
                    <div className="mx-auto mb-6 w-64 h-64 sm:w-72 sm:h-72 relative select-none">
                        <Image
                            src="/lost-students.png"
                            alt="Estudiantes perdidos buscando la página"
                            fill
                            className="object-contain drop-shadow-lg"
                            priority
                        />
                    </div>

                    {/* Mensaje amigable */}
                    <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-3">
                        ¡Ups! Parece que te perdiste 🗺️
                    </h1>
                    <p className="text-muted-foreground mb-8 leading-relaxed">
                        La página que buscás no existe o fue movida a otro lugar.<br />
                        ¡Pero no te preocupes, podés volver al inicio fácilmente!
                    </p>

                    {/* Acciones */}
                    <div className="flex items-center justify-center gap-3 flex-wrap">
                        <Link href="/">
                            <Button className="gap-2 rounded-xl">
                                <Home size={16} />
                                Ir al inicio
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            className="gap-2 rounded-xl"
                            onClick={() => history.back()}
                        >
                            <ArrowLeft size={16} />
                            Volver atrás
                        </Button>
                    </div>

                    <p className="mt-10 text-xs text-muted-foreground/50">
                        {brandName} — Plataforma de Gestión Educativa
                    </p>
                </div>
            </main>
        </div>
    );
}
