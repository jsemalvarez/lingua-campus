"use client";

import { useState, useTransition } from "react";
import { removeStudentFromCourseAction, markEnrollmentIncompleteAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { Trash2, UserX, X } from "lucide-react";
import { useRouter } from "next/navigation";

interface RemoveStudentButtonProps {
    enrollmentId: string;
    courseId: string;
    studentName: string;
}

export function RemoveStudentButton({ enrollmentId, courseId, studentName }: RemoveStudentButtonProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [actionType, setActionType] = useState<"INCOMPLETE" | "DELETE" | null>(null);

    const handleAction = () => {
        if (!actionType) return;
        
        startTransition(async () => {
            const result = actionType === "DELETE" 
                ? await removeStudentFromCourseAction(enrollmentId, courseId)
                : await markEnrollmentIncompleteAction(enrollmentId, courseId);
                
            if (result.success) {
                router.refresh();
            } else {
                alert(result.error || "Error al procesar acción");
            }
            setActionType(null);
        });
    };

    if (actionType) {
        return (
            <div className="flex items-center gap-1.5 animate-in fade-in slide-in-from-right-2 duration-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                    {actionType === "DELETE" ? "¿Eliminar?" : "¿Incompleto?"}
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    className={`h-7 px-2 text-[11px] font-bold ${actionType === "DELETE" ? "text-red-600 hover:bg-red-50" : "text-amber-600 hover:bg-amber-50"}`}
                    onClick={handleAction}
                    disabled={isPending}
                >
                    {isPending ? "..." : "Confirmar"}
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                    onClick={() => setActionType(null)}
                    disabled={isPending}
                >
                    <X size={14} />
                </Button>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                onClick={() => setActionType("INCOMPLETE")}
                title="Marcar Incompleto (No terminó)"
            >
                <UserX size={16} />
            </Button>

            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                onClick={() => setActionType("DELETE")}
                title="Eliminar inscripción (Error de carga)"
            >
                <Trash2 size={16} />
            </Button>
        </div>
    );
}
