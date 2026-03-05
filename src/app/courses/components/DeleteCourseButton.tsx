"use client";

import { useTransition } from "react";
import { deleteCourseAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { Trash2 } from "lucide-react";

export function DeleteCourseButton({ id }: { id: string }) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = async () => {
        if (!confirm("¿Seguro que deseas eliminar este curso? Los alumnos inscritos perderán su registro de este curso.")) return;

        startTransition(async () => {
            const result = await deleteCourseAction(id);
            if (!result.success) {
                alert(result.error);
            }
        });
    };

    return (
        <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            disabled={isPending}
            className="text-red-500 hover:text-red-600 hover:bg-red-50/50 dark:hover:bg-red-950/30"
            title="Eliminar curso"
        >
            <Trash2 size={16} />
        </Button>
    );
}
