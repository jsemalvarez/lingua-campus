"use client";

import { QRCodeSVG } from "qrcode.react";
import { Card } from "@/components/ui/Card";
import { QrCode } from "lucide-react";

interface StudentQRCardProps {
    studentId: string;
    studentName: string;
}

export function StudentQRCard({ studentId, studentName }: StudentQRCardProps) {
    return (
        <Card className="p-6 flex flex-col items-center text-center border-border/40 bg-card/50 relative overflow-hidden group">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors pointer-events-none" />
            
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                <QrCode size={16} className="text-primary" />
                Credencial de Asistencia
            </h3>
            
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-transform group-hover:scale-105 duration-300">
                <QRCodeSVG 
                    value={studentId} 
                    size={160} 
                    bgColor={"#ffffff"} 
                    fgColor={"#000000"} 
                    level={"H"} 
                    includeMargin={false}
                />
            </div>

            <p className="mt-4 text-xs text-muted-foreground px-4 leading-relaxed">
                Muestra este código al escáner del aula para registrar tu presente automáticamente.
            </p>
        </Card>
    );
}
