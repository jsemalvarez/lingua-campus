"use client";

import { useState, useTransition } from "react";
import { removeStudentFromCourseAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface RemoveStudentButtonProps {
    enrollmentId: string;
    courseId: string;
    studentName: string;
}

export function RemoveStudentButton({ enrollmentId, courseId, studentName }: RemoveStudentButtonProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [showConfirm, setShowConfirm] = useState(false);

    const handleRemove = () => {
        startTransition(async () => {
            const result = await removeStudentFromCourseAction(enrollmentId, courseId);
            if (result.success) {
                router.refresh();
            } else {
                alert(result.error || "Error al desinscribir");
            }
            setShowConfirm(false);
        });
    };

    if (showConfirm) {
        return (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200">
                <span className="text-xs text-red-600 dark:text-red-400 font-medium whitespace-nowrap">
                    ¿Confirmar?
                </span>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 font-bold"
                    onClick={handleRemove}
                    disabled={isPending}
                >
                    {isPending ? "..." : "Sí"}
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                    onClick={() => setShowConfirm(false)}
                    disabled={isPending}
                >
                    No
                </Button>
            </div>
        );
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 opacity-0 group-hover:opacity-100 transition-all"
            onClick={() => setShowConfirm(true)}
            title={`Desinscribir a ${studentName}`}
        >
            <Trash2 size={16} />
        </Button>
    );
}
