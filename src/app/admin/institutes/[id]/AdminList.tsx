"use client";

import { useState, useTransition } from "react";
import { addInstituteAdminAction, removeInstituteAdminAction } from "../../actions";
import { Button } from "@/components/ui/Button";
import { Trash2, UserPlus, Mail, User, AlertCircle, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface AdminUser {
    id: string;
    name: string;
    email: string;
}

interface AdminListProps {
    instituteId: string;
    admins: AdminUser[];
}

export function AdminList({ instituteId, admins }: AdminListProps) {
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [isAdding, setIsAdding] = useState(false);

    const handleAddAdmin = async (formData: FormData) => {
        setStatus("idle");
        formData.append("instituteId", instituteId);

        startTransition(async () => {
            const result = await addInstituteAdminAction(formData);
            if (result.success) {
                setStatus("success");
                setIsAdding(false);
                setTimeout(() => setStatus("idle"), 3000);
            } else {
                setStatus("error");
                setErrorMsg(result.error ?? "No se pudo agregar");
            }
        });
    };

    const handleRemoveAdmin = async (adminId: string) => {
        if (!confirm("¿Seguro que quieres eliminar este administrador? Perderá acceso a la plataforma.")) return;

        startTransition(async () => {
            const result = await removeInstituteAdminAction(adminId, instituteId);
            if (result.success) {
                // success
            } else {
                alert(result.error ?? "Error al eliminar");
            }
        });
    };

    return (
        <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold">Administradores</h2>
                    <p className="text-sm text-muted-foreground mt-1">Gestión de acceso para directivos del instituto.</p>
                </div>
                {!isAdding && (
                    <Button variant="outline" size="sm" onClick={() => setIsAdding(true)}>
                        <UserPlus size={16} className="mr-2" /> Agregar
                    </Button>
                )}
            </div>

            {/* Listado de admins */}
            <div className="space-y-4">
                {admins.map((admin) => (
                    <div key={admin.id} className="flex items-center justify-between p-4 rounded-xl border border-border/60 bg-background shadow-sm hover:shadow-md transition-all group">
                        <div className="flex items-center gap-4 overflow-hidden">
                            <div className="h-10 w-10 flex-shrink-0 bg-primary/10 text-primary font-bold rounded-full flex items-center justify-center">
                                {admin.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="overflow-hidden">
                                <p className="font-semibold text-sm truncate">{admin.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{admin.email}</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="text-muted-foreground opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-all rounded-full h-8 w-8"
                            onClick={() => handleRemoveAdmin(admin.id)}
                            disabled={isPending}
                            title="Remover Acceso"
                        >
                            <Trash2 size={16} />
                        </Button>
                    </div>
                ))}

                {admins.length === 0 && (
                    <div className="text-center p-8 border border-dashed rounded-xl border-border/50 text-muted-foreground text-sm">
                        No hay administradores registrados para este instituto.
                    </div>
                )}
            </div>

            {/* Formulario Añadir */}
            {isAdding && (
                <div className="mt-6 p-5 border border-primary/20 bg-primary/5 rounded-xl animate-in fade-in zoom-in-95">
                    <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                        <UserPlus size={16} className="text-primary" />
                        Nuevo Administrador
                    </h3>
                    <form action={handleAddAdmin} className="space-y-4">
                        <div className="space-y-3">
                            <input
                                name="name"
                                placeholder="Nombre completo"
                                className="w-full px-3.5 py-2.5 rounded-lg border border-input text-sm bg-background"
                                required
                            />
                            <input
                                name="email"
                                type="email"
                                placeholder="Email (ej. juan@gmail.com)"
                                className="w-full px-3.5 py-2.5 rounded-lg border border-input text-sm bg-background"
                                required
                            />
                            <p className="text-xs text-muted-foreground mb-4">La contraseña por defecto será: <span className="font-bold text-foreground">admin123</span></p>
                        </div>

                        {status === "error" && (
                            <div className="text-xs text-red-500 flex items-center gap-1">
                                <AlertCircle size={14} /> {errorMsg}
                            </div>
                        )}

                        <div className="flex justify-end gap-2 pt-2 border-t border-border/30">
                            <Button type="button" variant="ghost" size="sm" onClick={() => setIsAdding(false)} disabled={isPending}>
                                Cancelar
                            </Button>
                            <Button type="submit" size="sm" className="bg-primary text-primary-foreground" disabled={isPending}>
                                {isPending ? "Guardando..." : "Crear Acceso"}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {status === "success" && !isAdding && (
                <div className="flex items-center gap-2 p-3 mt-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-sm font-medium animate-in">
                    <CheckCircle size={16} /> Administrador guardado.
                </div>
            )}
        </div>
    );
}
