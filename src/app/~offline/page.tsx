"use client";

import { WifiOff, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function OfflinePage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -right-40 w-[30rem] h-[30rem] bg-primary/10 dark:bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute -bottom-40 -left-40 w-[30rem] h-[30rem] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-md w-full text-center space-y-8 relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mx-auto w-24 h-24 bg-muted/50 rounded-full flex items-center justify-center relative">
                    <WifiOff className="w-12 h-12 text-muted-foreground" />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 premium-gradient rounded-full shadow-lg flex items-center justify-center">
                        <span className="text-white text-xs font-bold">L</span>
                    </div>
                </div>

                <div className="space-y-3">
                    <h1 className="text-3xl font-extrabold tracking-tight">Sin Conexión</h1>
                    <p className="text-muted-foreground font-medium text-sm leading-relaxed">
                        Parece que perdiste la conexión a internet. Verificá tu red y volvé a intentarlo. 
                        La plataforma requiere conexión para sincronizar los datos.
                    </p>
                </div>

                <Button 
                    variant="primary" 
                    className="w-full premium-gradient h-12 text-base font-bold shadow-md shadow-primary/20 flex items-center justify-center gap-2 transition-all hover:shadow-primary/30"
                    onClick={() => window.location.reload()}
                >
                    <RotateCw className="w-5 h-5" />
                    Reintentar conexión
                </Button>
            </div>
        </div>
    );
}
