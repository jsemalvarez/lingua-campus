"use client";

import { useTransition } from "react";
import { deleteLessonAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { Trash2 } from "lucide-react";

interface DeleteLessonButtonProps {
    lessonId: string;
    courseId: string;
}

export function DeleteLessonButton({ lessonId, courseId }: DeleteLessonButtonProps) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        if (!confirm("¿Estás seguro de que deseas eliminar esta clase y toda su asistencia asociada? Esta acción no se puede deshacer.")) {
            return;
        }

        startTransition(async () => {
            const result = await deleteLessonAction(lessonId, courseId);
            if (!result.success) {
                alert(result.error ?? "No se pudo eliminar la clase");
            }
        });
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isPending}
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
            title="Eliminar Clase"
        >
            <Trash2 size={16} />
        </Button>
    );
}
