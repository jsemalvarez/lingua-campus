"use client";

import { useState, useEffect, useRef } from "react";
import { Scanner, IDetectedBarcode } from "@yudiel/react-qr-scanner";
import { ArrowLeft, UserCheck, XCircle } from "lucide-react";
import Link from "next/link";
import { scanAttendanceQRAction } from "../actions";

interface QRKioskClientProps {
    courseId: string;
    lessonId: string;
    courseName: string;
    lessonTopic: string;
}

const SUCCESS_PHRASES = [
    "¡Qué bueno verte, {name}! Asistencia perfecta. 🚀",
    "¡Excelente energía para hoy, {name}! Presente. ⭐",
    "¡Welcome to class, {name}! 🇬🇧",
    "¡Genial tenerte aquí, {name}! 👏",
    "¡Presente! A darlo todo hoy, {name}. 🔥"
];

export function QRKioskClient({ courseId, lessonId, courseName, lessonTopic }: QRKioskClientProps) {
    const [scannedResult, setScannedResult] = useState<string | null>(null);
    const [status, setStatus] = useState<"SCANNING" | "PROCESSING" | "SUCCESS" | "ERROR">("SCANNING");
    const [studentName, setStudentName] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [phrase, setPhrase] = useState("");
    
    // Use a ref to prevent multiple sudden scans
    const isProcessingRef = useRef(false);

    const handleScan = async (detectedCodes: IDetectedBarcode[]) => {
        if (isProcessingRef.current || detectedCodes.length === 0) return;
        
        const rawValue = detectedCodes[0].rawValue;
        if (!rawValue) return;

        isProcessingRef.current = true;
        setStatus("PROCESSING");
        setScannedResult(rawValue);

        // Llamar a Server Action
        const res = await scanAttendanceQRAction(lessonId, courseId, rawValue);
        
        if (res.success && res.studentName) {
            setStudentName(res.studentName);
            const randomPhrase = SUCCESS_PHRASES[Math.floor(Math.random() * SUCCESS_PHRASES.length)];
            setPhrase(randomPhrase.replace("{name}", res.studentName.split(" ")[0]));
            setStatus("SUCCESS");
        } else {
            setErrorMessage(res.error || "Código QR no válido para este curso.");
            setStatus("ERROR");
        }

        // Auto-reset después de 2.5 segundos
        setTimeout(() => {
            resetScanner();
        }, 2500);
    };

    const resetScanner = () => {
        setScannedResult(null);
        setStudentName("");
        setErrorMessage("");
        setStatus("SCANNING");
        isProcessingRef.current = false;
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-slate-950 relative">
            
            {/* Header / Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex justify-between items-center z-50 bg-gradient-to-b from-slate-950/80 to-transparent">
                <Link 
                    href={`/courses/${courseId}/lessons/${lessonId}/attendance`} 
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900/80 backdrop-blur-md rounded-full text-slate-300 hover:text-white transition-colors text-sm font-bold border border-slate-800"
                >
                    <ArrowLeft size={16} /> Volver
                </Link>

                <div className="text-right">
                    <h2 className="text-xl sm:text-2xl font-black text-white drop-shadow-md">{courseName}</h2>
                    <p className="text-slate-400 font-semibold text-sm drop-shadow">{lessonTopic}</p>
                </div>
            </div>

            {/* Main Scanner Container */}
            <div className="flex-1 w-full h-full relative flex items-center justify-center bg-black">
                {status === "SCANNING" || status === "PROCESSING" ? (
                    <div className="w-full h-full max-w-3xl max-h-screen aspect-video sm:aspect-auto flex items-center justify-center relative shadow-2xl overflow-hidden">
                        <Scanner 
                            onScan={handleScan}
                            onError={(error) => console.log(error)} 
                            paused={status === "PROCESSING"}
                            styles={{
                                container: { width: "100%", height: "100%" },
                                video: { objectFit: "cover" }
                            }}
                        />
                        
                        {/* Overlay Guía visual */}
                        <div className="absolute inset-x-0 bottom-12 flex justify-center z-10">
                            <div className="bg-black/60 backdrop-blur-md px-6 py-3 rounded-full border border-slate-800/50 shadow-2xl animate-pulse">
                                <p className="text-slate-300 font-bold tracking-widest uppercase text-sm">
                                    {status === "SCANNING" ? "📱 Muestra tu tarjeta QR a la cámara" : "Procesando..."}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : null}

                {/* OVERLAYS DE GAMIFICACIÓN */}
                {status === "SUCCESS" && (
                    <div className="absolute inset-0 z-40 bg-emerald-600 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
                        <div className="w-40 h-40 bg-white/20 rounded-full flex items-center justify-center mb-6 animate-bounce">
                            <UserCheck size={80} className="text-white" />
                        </div>
                        <h1 className="text-4xl sm:text-6xl font-black text-white text-center tracking-tight drop-shadow-lg mb-4">
                            ¡Presente!
                        </h1>
                        <p className="text-2xl sm:text-3xl text-emerald-100 font-bold text-center max-w-2xl leading-relaxed">
                            {phrase}
                        </p>
                    </div>
                )}

                {status === "ERROR" && (
                    <div className="absolute inset-0 z-40 bg-red-600 flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
                        <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center mb-6">
                            <XCircle size={64} className="text-white" />
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-black text-white text-center tracking-tight drop-shadow-lg mb-4">
                            Error al registrar
                        </h1>
                        <p className="text-xl sm:text-2xl text-red-100 font-bold text-center max-w-xl">
                            {errorMessage}
                        </p>
                    </div>
                )}
            </div>
            
        </div>
    );
}
