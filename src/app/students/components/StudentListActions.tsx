"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { Eye, RotateCcw, Trash2, AlertTriangle, X } from "lucide-react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { restoreStudentAction, hardDeleteStudentAction } from "../[id]/actions";
import { useRouter } from "next/navigation";

export function StudentListActions({ studentId, studentName, isActive }: { studentId: string; studentName: string; isActive: boolean }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const handleRestore = () => {
        if (!confirm(`¿Restaurar a ${studentName} y devolverlo a la lista de activos?`)) return;
        
        startTransition(async () => {
            const res = await restoreStudentAction(studentId);
            if (res.success) {
                router.refresh();
            } else {
                alert(res.error || "Ocurrió un error");
            }
        });
    };

    const handleHardDelete = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("idle");
        
        startTransition(async () => {
            const res = await hardDeleteStudentAction(studentId);
            if (res.success) {
                setStatus("success");
                setTimeout(() => {
                    setIsModalOpen(false);
                    router.refresh();
                }, 1000);
            } else {
                setStatus("error");
                setErrorMsg(res.error || "Error al purgar");
            }
        });
    };

    if (isActive) {
        return (
            <Link href={`/students/${studentId}`}>
                <Button variant="ghost" size="icon" className="text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary transition-all rounded-full h-8 w-8">
                    <Eye size={16} />
                </Button>
            </Link>
        );
    }

    return (
        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
            <Button
                variant="ghost"
                size="icon"
                title="Restaurar estudiante"
                onClick={handleRestore}
                disabled={isPending}
                className="text-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 h-8 w-8 rounded-full"
            >
                <RotateCcw size={16} />
            </Button>
            
            <Button
                variant="ghost"
                size="icon"
                title="Eliminar permanentemente"
                onClick={() => setIsModalOpen(true)}
                disabled={isPending}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 h-8 w-8 rounded-full"
            >
                <Trash2 size={16} />
            </Button>

            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-card w-full max-w-md rounded-2xl shadow-xl border border-border/60 overflow-hidden animate-in zoom-in-95">
                        <div className="px-6 py-4 border-b border-border/40 flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-red-600">
                                <AlertTriangle className="text-red-500" /> Borrar Definitivamente
                            </h2>
                            <Button variant="ghost" size="icon" onClick={() => !isPending && setIsModalOpen(false)}>
                                <X size={20} />
                            </Button>
                        </div>
                        
                        <form onSubmit={handleHardDelete} className="p-6 space-y-4">
                            <p className="text-sm text-muted-foreground mb-4 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 p-3 rounded-lg border border-red-200 dark:border-red-900/50 leading-relaxed">
                                Estás apunto de borrar permanentemente a <strong>{studentName}</strong>.<br/><br/>
                                Esto destruirá en cascada su historial de asistencia, calificaciones, pagos, e inscripciones a cursos. 
                                Esta acción <strong>NO se puede deshacer</strong>.
                            </p>
                            
                            {status === "success" && (
                                <p className="text-sm font-medium text-emerald-600">Purgado exitosamente.</p>
                            )}
                            {status === "error" && (
                                <p className="text-sm font-medium text-red-600">{errorMsg}</p>
                            )}
                            
                            <div className="pt-4 flex justify-end gap-3 border-t border-border/40 mt-2">
                                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={isPending}>
                                    Cancelar
                                </Button>
                                <Button type="submit" variant="destructive" disabled={isPending}>
                                    {isPending ? "Borrando..." : "Sí, Purgar"}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
