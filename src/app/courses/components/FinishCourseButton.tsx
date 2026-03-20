"use client";

import { useState, useTransition } from "react";
import { finishCourseAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface FinishCourseButtonProps {
    courseId: string;
    courseName: string;
}

export function FinishCourseButton({ courseId, courseName }: FinishCourseButtonProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [showConfirm, setShowConfirm] = useState(false);

    const handleFinish = () => {
        startTransition(async () => {
            const result = await finishCourseAction(courseId);
            if (result.success) {
                router.refresh();
            } else {
                alert(result.error || "Error al finalizar el curso");
            }
            setShowConfirm(false);
        });
    };

    if (showConfirm) {
        return (
            <div className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <AlertTriangle size={20} />
                    <span className="text-sm font-bold">¿Finalizar curso "{courseName}"?</span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="flex-1 sm:flex-none h-9 px-4 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm"
                        onClick={handleFinish}
                        disabled={isPending}
                    >
                        {isPending ? "Procesando..." : "Sí, Finalizar"}
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 p-0 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded-lg"
                        onClick={() => setShowConfirm(false)}
                        disabled={isPending}
                    >
                        <X size={18} />
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <Button
            onClick={() => setShowConfirm(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-xl shadow-lg shadow-emerald-600/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
        >
            <CheckCircle2 size={18} />
            Finalizar Curso
        </Button>
    );
}
