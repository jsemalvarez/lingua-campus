"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, KeyRound, Trash2 } from "lucide-react";
import { resetStudentPassword, softDeleteStudent } from "./actions";
import { useRouter } from "next/navigation";

export function StudentDangerZone({ studentId }: { studentId: string }) {
    const router = useRouter();
    const [isResetting, setIsResetting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [customPassword, setCustomPassword] = useState("");
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleReset = async () => {
        if (!confirm("¿Estás seguro de restablecer la contraseña de este estudiante?")) return;

        setIsResetting(true);
        setError(null);
        setSuccessMessage(null);

        const res = await resetStudentPassword(studentId, customPassword || undefined);

        if (res.success) {
            setSuccessMessage(`¡Contraseña restablecida exitosamente! Nueva contraseña temporal: ${res.newPassword}`);
            setCustomPassword("");
        } else {
            setError(res.error || "Ocurrió un error inesperado.");
        }
        setIsResetting(false);
    };

    const handleDelete = async () => {
        if (!confirm("⚠️ ¿Estás seguro de que querés eliminar este estudiante?\n\nEl estudiante será dado de baja (borrado lógico). Sus pagos e historial académico se conservarán para mantener la integridad de las métricas del instituto.\n\nEsta acción se puede revertir.")) return;

        setIsDeleting(true);
        setError(null);
        setSuccessMessage(null);

        const res = await softDeleteStudent(studentId);

        if (res.success) {
            router.push("/students");
        } else {
            setError(res.error || "Ocurrió un error al eliminar el estudiante.");
            setIsDeleting(false);
        }
    };

    return (
        <Card className="mt-8 border-red-500/30 bg-red-500/5">
            <div className="p-6">
                <div className="flex items-center gap-2 text-red-600 mb-4">
                    <AlertTriangle size={24} />
                    <h3 className="text-lg font-bold">Zona de Peligro</h3>
                </div>

                <div className="space-y-6">
                    {/* Restablecer Contraseña */}
                    <div>
                        <h4 className="font-semibold text-foreground">Restablecer Contraseña</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                            Permite asignar una nueva contraseña al estudiante para que pueda acceder a su cuenta. Si dejas el campo vacío, se asignará una contraseña genérica por defecto.
                        </p>
                    </div>

                    {successMessage && (
                        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 rounded-md text-sm font-medium">
                            {successMessage}
                        </div>
                    )}
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-700 rounded-md text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3">
                        <input
                            type="text"
                            placeholder="Nueva contraseña (Opcional)"
                            value={customPassword}
                            onChange={(e) => setCustomPassword(e.target.value)}
                            className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed disabled:opacity-50 sm:max-w-[250px]"
                        />
                        <Button
                            variant="destructive"
                            onClick={handleReset}
                            disabled={isResetting}
                            className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                        >
                            <KeyRound size={16} className="mr-2" />
                            {isResetting ? "Restableciendo..." : "Restablecer"}
                        </Button>
                    </div>

                    {/* Separador */}
                    <div className="border-t border-red-500/20" />

                    {/* Eliminar Estudiante */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <h4 className="font-semibold text-foreground">Eliminar Estudiante</h4>
                            <p className="text-sm text-muted-foreground mt-1">
                                Dar de baja al estudiante. Sus pagos y notas se conservan para mantener la integridad de las métricas. Esta acción es reversible.
                            </p>
                        </div>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-red-600 hover:bg-red-700 w-full sm:w-auto flex-shrink-0"
                        >
                            <Trash2 size={16} className="mr-2" />
                            {isDeleting ? "Eliminando..." : "Eliminar Estudiante"}
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
}
