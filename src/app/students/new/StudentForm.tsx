"use client";

import { useTransition, useState } from "react";
import { createStudentAction } from "./actions";
import { Button } from "@/components/ui/Button";
import { User, Phone, Mail, Calendar, Users, Shield, CheckCircle, AlertCircle, Lock } from "lucide-react";
import { useRouter } from "next/navigation";

export function StudentForm() {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (formData: FormData) => {
        setStatus("idle");
        startTransition(async () => {
            const result = await createStudentAction(formData);
            if (result.success) {
                setStatus("success");
                setTimeout(() => {
                    router.push("/students");
                }, 2000);
            } else {
                setStatus("error");
                setErrorMsg(result.error ?? "Ocurrió un error");
            }
        });
    };

    return (
        <form action={handleSubmit} className="divide-y divide-border/50">
            {/* ── 1. Datos Personales del Alumno ── */}
            <div className="p-6 sm:p-8 space-y-6">
                <div className="flex items-center gap-2 mb-4">
                    <User className="text-primary w-5 h-5" />
                    <h2 className="text-lg font-bold">Datos del Alumno</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5 sm:col-span-2">
                        <label className="text-sm font-semibold text-foreground/80">Nombre Completo *</label>
                        <input
                            name="name"
                            placeholder="Ej: Sofía Martínez"
                            className="w-full px-4 py-2.5 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring/30 transition-all font-medium"
                            required
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-foreground/80">Fecha de Nacimiento</label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <input
                                name="birthDate"
                                type="date"
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring/30 transition-all text-sm [color-scheme:light] dark:[color-scheme:dark]"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-foreground/80">Celular del Alumno</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <input
                                name="phone"
                                type="tel"
                                placeholder="+54 9 11 1234-5678"
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring/30 transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-foreground/80">Email del Alumno</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <input
                                name="email"
                                type="email"
                                placeholder="sofia@ejemplo.com"
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring/30 transition-all text-sm"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold text-foreground/80">Contraseña de Acceso</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                            <input
                                name="password"
                                type="password"
                                placeholder="..."
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring/30 transition-all text-sm"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 text-right sm:text-left">Dejar en blanco para usar la contraseña por defecto: <span className="font-semibold text-foreground/80">estudiante123</span></p>
                    </div>
                </div>
            </div>

            {/* ── 2. Tutor Legal 1 ── */}
            <div className="p-6 sm:p-8 space-y-6 bg-muted/10">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Shield className="text-emerald-500 dark:text-emerald-400 w-5 h-5" />
                        <h2 className="text-lg font-bold">Tutor Legal 1</h2>
                    </div>
                    <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground bg-muted px-2 py-1 rounded-md">Principal</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-1.5 md:col-span-1">
                        <label className="text-sm font-semibold text-foreground/80">Nombre Completo</label>
                        <input
                            name="g1Name"
                            placeholder="Nombre del Tutor"
                            className="w-full px-4 py-2.5 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring/30 transition-all text-sm"
                        />
                    </div>
                    <div className="space-y-1.5 md:col-span-1">
                        <label className="text-sm font-semibold text-foreground/80">Parentesco</label>
                        <select
                            name="g1Relation"
                            className="w-full px-4 py-2.5 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring/30 transition-all text-sm appearance-none"
                        >
                            <option value="">Seleccionar...</option>
                            <option value="Madre">Madre</option>
                            <option value="Padre">Padre</option>
                            <option value="Abuelo/a">Abuelo/a</option>
                            <option value="Hermano/a">Hermano/a</option>
                            <option value="Tío/a">Tío/a</option>
                            <option value="Otro">Otro</option>
                        </select>
                    </div>
                    <div className="space-y-1.5 md:col-span-1">
                        <label className="text-sm font-semibold text-foreground/80">Celular del Tutor</label>
                        <input
                            name="g1Phone"
                            type="tel"
                            placeholder="Ej: +54 9 11 0000-0000"
                            className="w-full px-4 py-2.5 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring/30 transition-all text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* ── 3. Tutor Legal 2 ── */}
            <div className="p-6 sm:p-8 space-y-6 bg-muted/5">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Users className="text-blue-500 dark:text-blue-400 w-5 h-5" />
                        <h2 className="text-lg font-bold">Tutor Legal 2 <span className="text-muted-foreground font-normal text-sm ml-1">(Opcional)</span></h2>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-1.5 md:col-span-1">
                        <label className="text-sm font-semibold text-foreground/80">Nombre Completo</label>
                        <input
                            name="g2Name"
                            placeholder="Nombre del Tutor"
                            className="w-full px-4 py-2.5 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring/30 transition-all text-sm"
                        />
                    </div>
                    <div className="space-y-1.5 md:col-span-1">
                        <label className="text-sm font-semibold text-foreground/80">Parentesco</label>
                        <select
                            name="g2Relation"
                            className="w-full px-4 py-2.5 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring/30 transition-all text-sm appearance-none"
                        >
                            <option value="">Seleccionar...</option>
                            <option value="Madre">Madre</option>
                            <option value="Padre">Padre</option>
                            <option value="Abuelo/a">Abuelo/a</option>
                            <option value="Hermano/a">Hermano/a</option>
                            <option value="Tío/a">Tío/a</option>
                            <option value="Otro">Otro</option>
                        </select>
                    </div>
                    <div className="space-y-1.5 md:col-span-1">
                        <label className="text-sm font-semibold text-foreground/80">Celular del Tutor</label>
                        <input
                            name="g2Phone"
                            type="tel"
                            placeholder="Ej: +54 9 11 0000-0000"
                            className="w-full px-4 py-2.5 rounded-xl border border-input bg-background focus:ring-2 focus:ring-ring/30 transition-all text-sm"
                        />
                    </div>
                </div>
            </div>

            {/* ── Feedback & Acciones ── */}
            <div className="p-6 sm:p-8 bg-background border-t border-border/50 rounded-b-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="w-full sm:w-auto flex-1">
                    {status === "success" && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-sm animate-in">
                            <CheckCircle size={16} className="shrink-0" />
                            Estudiante guardado. Redirigiendo...
                        </div>
                    )}
                    {status === "error" && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-sm animate-in">
                            <AlertCircle size={16} className="shrink-0" />
                            {errorMsg}
                        </div>
                    )}
                </div>

                <div className="flex w-full sm:w-auto gap-3">
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full sm:w-auto"
                        onClick={() => router.push("/students")}
                        disabled={isPending}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        className="w-full sm:w-auto premium-gradient shadow-md"
                        disabled={isPending}
                    >
                        {isPending ? "Procesando..." : "Inscribir Alumno"}
                    </Button>
                </div>
            </div>
        </form>
    );
}
