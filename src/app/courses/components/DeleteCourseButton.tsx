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
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700 w-full sm:w-auto flex-shrink-0"
            title="Eliminar curso"
        >
            <Trash2 size={16} className="mr-2" />
            {isPending ? "Eliminando..." : "Eliminar Curso"}
        </Button>
    );
}
