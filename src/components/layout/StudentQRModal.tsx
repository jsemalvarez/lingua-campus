"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, X } from "lucide-react";

interface StudentQRModalProps {
    studentId: string;
    studentName: string;
    /** "icon" = small icon button for top bar (default). "nav" = icon + label for bottom/side nav. */
    variant?: "icon" | "nav";
    isActive?: boolean;
}

export function StudentQRModal({ studentId, studentName, variant = "icon", isActive }: StudentQRModalProps) {
    const [open, setOpen] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);

    // Only render portal after mount (SSR-safe)
    React.useEffect(() => { setMounted(true); }, []);

    // Close on Escape, lock body scroll while open
    React.useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
        document.addEventListener("keydown", handler);
        document.body.style.overflow = "hidden";
        return () => {
            document.removeEventListener("keydown", handler);
            document.body.style.overflow = "";
        };
    }, [open]);

    // ── Trigger button ──────────────────────────────────────────────────────────
    const trigger =
        variant === "nav" ? (
            <button
                onClick={() => setOpen(true)}
                title="Mi QR de asistencia"
                className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl cursor-pointer transition-all md:flex-none md:w-full ${isActive || open ? "text-primary" : "text-foreground/40 hover:text-foreground/60"
                    }`}
            >
                <div className={`flex flex-col items-center justify-center w-12 h-10 rounded-xl transition-all ${(isActive || open) ? "bg-primary/5" : ""
                    }`}>
                    <QrCode size={20} />
                </div>
                <span className="text-[10px] hidden md:block mt-1 font-medium px-1 text-center leading-tight">Mi QR</span>
            </button>
        ) : (
            <button
                onClick={() => setOpen(true)}
                title="Mi QR de asistencia"
                className="flex h-8 w-8 sm:h-9 sm:w-9 rounded-xl items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors border border-transparent hover:border-primary/20"
            >
                <QrCode size={20} />
            </button>
        );

    // ── Modal (portaled to body to escape any stacking context) ─────────────────
    const modal = open && mounted
        ? createPortal(
            <div
                className="fixed inset-0 z-[9999] flex"
                onClick={() => setOpen(false)}
                style={{ margin: 0 }}
            >
                {/* Backdrop */}
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                {/* Card — full-screen on mobile, centered card on ≥sm */}
                <div
                    className={[
                        // Mobile: full sheet
                        "relative z-10 bg-card flex flex-col items-center",
                        "w-full h-full",
                        // ≥sm: auto-sized centered card
                        "sm:m-auto sm:h-auto sm:w-auto sm:max-w-sm sm:rounded-3xl sm:border sm:border-border/60 sm:shadow-2xl",
                    ].join(" ")}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close */}
                    <button
                        onClick={() => setOpen(false)}
                        className="absolute top-4 right-4 flex h-9 w-9 items-center justify-center rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                        <X size={20} />
                    </button>

                    {/* Content — fills screen on mobile, auto on desktop */}
                    <div className="flex flex-col items-center justify-center gap-6 w-full h-full p-8 sm:p-10">
                        {/* Header */}
                        <div className="flex flex-col items-center gap-2 text-center">
                            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                                <QrCode size={26} className="text-primary" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground">Credencial de Asistencia</h2>
                            <p className="text-sm text-muted-foreground">{studentName}</p>
                        </div>

                        {/* QR code */}
                        <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-200">
                            <QRCodeSVG
                                value={studentId}
                                size={220}
                                bgColor="#ffffff"
                                fgColor="#000000"
                                level="H"
                                includeMargin={false}
                            />
                        </div>

                        {/* Hint */}
                        <p className="text-sm text-muted-foreground text-center leading-relaxed max-w-xs">
                            Muestra este código al escáner del aula para registrar tu presente automáticamente.
                        </p>
                    </div>
                </div>
            </div>,
            document.body
        )
        : null;

    return (
        <>
            {trigger}
            {modal}
        </>
    );
}
