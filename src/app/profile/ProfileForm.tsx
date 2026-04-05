"use client";

import { useTransition, useState } from "react";
import { updateProfileAction } from "./actions";
import { Button } from "@/components/ui/Button";
import { UserCircle, CheckCircle, AlertCircle, Phone } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface ProfileFormProps {
    initialData: {
        name: string;
        phone: string | null;
        email: string | null;
        role: string;
        dni?: string | null;
        address?: string | null;
        birthDate?: Date | null;
        guardian1Name?: string | null;
        guardian1Relation?: string | null;
        guardian1Phone?: string | null;
        guardian2Name?: string | null;
        guardian2Relation?: string | null;
        guardian2Phone?: string | null;
        schoolInfo?: string | null;
        registeredLevel?: string | null;
    };
}

export function ProfileForm({ initialData }: ProfileFormProps) {
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const isStudent = initialData.role === "STUDENT";

    const handleSubmit = async (formData: FormData) => {
        setStatus("idle");
        startTransition(async () => {
            const result = await updateProfileAction(formData);
            if (result.success) {
                setStatus("success");
                setTimeout(() => setStatus("idle"), 4000);
            } else {
                setStatus("error");
                setErrorMsg(result.error ?? "Ocurrió un error");
            }
        });
    };

    return (
        <form action={handleSubmit} className="space-y-8">
            <div className="space-y-6">
                {/* ── SECCIÓN 1: DATOS PERSONALES ────────────────────────────── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5 sm:col-span-2">
                        <label htmlFor="name" className="text-sm font-semibold text-foreground/80">
                            Nombre Completo
                        </label>
                        <input
                            id="name"
                            name="name"
                            defaultValue={initialData.name || ""}
                            placeholder="Ej: Laura Martinez"
                            className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="dni" className="text-sm font-semibold text-foreground/80">
                            DNI / Documento
                        </label>
                        <input
                            id="dni"
                            name="dni"
                            defaultValue={initialData.dni || ""}
                            placeholder="Ej: 12345678"
                            className="w-full px-4 py-2.5 rounded-xl border border-input bg-muted/30 text-sm focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
                            disabled={isStudent} // Los alumnos no pueden cambiarse el DNI solos
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label htmlFor="phone" className="text-sm font-semibold text-foreground/80">
                            Teléfono Celular
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                defaultValue={initialData.phone ?? ""}
                                placeholder="+54 9 11 1234-5678"
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
                            />
                        </div>
                    </div>

                    {isStudent && (
                        <>
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-foreground/80 text-muted-foreground">Fecha de Nacimiento</label>
                                <div className="px-4 py-2.5 rounded-xl border border-input bg-muted/30 text-sm">
                                    {initialData.birthDate ? new Date(initialData.birthDate).toLocaleDateString('es-AR') : "No registrada"}
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label htmlFor="address" className="text-sm font-semibold text-foreground/80">Dirección / Domicilio</label>
                                <input
                                    id="address"
                                    name="address"
                                    defaultValue={initialData.address || ""}
                                    placeholder="Ej: Calle Falsa 123"
                                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm focus:ring-2 focus:ring-ring/30 focus:border-ring transition-all"
                                />
                            </div>
                        </>
                    )}
                </div>

                {/* ── SECCIÓN 2: TUTORES (Solo alumnos) ───────────────────────── */}
                {isStudent && (
                    <div className="pt-6 border-t border-border/50 space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-primary/70">Tutores Responsables</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="p-4 rounded-2xl bg-muted/20 border border-border/50">
                                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Tutor 1</p>
                                <p className="font-bold text-sm">{initialData.guardian1Name || "No registrado"}</p>
                                <p className="text-xs text-muted-foreground italic">{initialData.guardian1Relation}</p>
                                {initialData.guardian1Phone && <p className="text-xs mt-1 font-mono">{initialData.guardian1Phone}</p>}
                            </div>
                            <div className="p-4 rounded-2xl bg-muted/20 border border-border/50">
                                <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Tutor 2</p>
                                <p className="font-bold text-sm">{initialData.guardian2Name || "No registrado"}</p>
                                <p className="text-xs text-muted-foreground italic">{initialData.guardian2Relation}</p>
                                {initialData.guardian2Phone && <p className="text-xs mt-1 font-mono">{initialData.guardian2Phone}</p>}
                            </div>
                        </div>
                    </div>
                )}

                {/* ── SECCIÓN 3: INFORMACIÓN ACADÉMICA (Solo alumnos) ────────────── */}
                {isStudent && (
                    <div className="pt-6 border-t border-border/50 space-y-4">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-primary/70">Información Académica</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Institución Escolar</label>
                                <p className="text-sm font-medium">{initialData.schoolInfo || "N/A"}</p>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-muted-foreground">Nivel registrado</label>
                                <p className="text-sm font-medium">{initialData.registeredLevel || "Sin nivel"}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Rol e Email (Sólo lectura) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-border/50">
                    <div className="space-y-1.5 opacity-70 sm:col-span-2">
                        <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email de cuenta</label>
                        <div className="px-4 py-2.5 rounded-xl border border-input bg-muted/50 text-sm font-medium">
                            {initialData.email || "No registrado"}
                        </div>
                    </div>
                </div>
            </div>

            {/* Feedback */}
            {status === "success" && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-sm animate-in">
                    <CheckCircle size={16} className="shrink-0" />
                    ¡Tu perfil ha sido actualizado!
                </div>
            )}
            {status === "error" && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-sm animate-in">
                    <AlertCircle size={16} className="shrink-0" />
                    {errorMsg}
                </div>
            )}

            {/* Botón de Guardado */}
            <Button
                type="submit"
                className="w-full sm:w-auto mt-2 premium-gradient shadow-md shadow-primary/20"
                disabled={isPending}
            >
                {isPending ? (
                    <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                        Guardando...
                    </span>
                ) : (
                    "Guardar Cambios"
                )}
            </Button>
        </form>
    );
}
