"use client";

import { useTransition, useState } from "react";
import { createPreEnrollmentAction } from "./actions";
import { Button } from "@/components/ui/Button";
import { User, Phone, Mail, Calendar, Users, CheckCircle, AlertCircle, Heart, MapPin, Inbox, GraduationCap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface Level {
    id: string;
    name: string;
}

interface RegistrationFormProps {
    instituteId: string;
    instituteName: string;
    instituteLevels: Level[];
}

export function RegistrationForm({ instituteId, instituteName, instituteLevels }: RegistrationFormProps) {
    const [isPending, startTransition] = useTransition();
    const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");
    const [formType, setFormType] = useState<"adult" | "minor">("adult");

    const handleSubmit = async (formData: FormData) => {
        setStatus("idle");
        startTransition(async () => {
            const result = await createPreEnrollmentAction(formData, instituteId);
            if (result.success) {
                setStatus("success");
            } else {
                setStatus("error");
                setErrorMsg(result.error ?? "Ocurrió un error");
            }
        });
    };

    if (status === "success") {
        return (
            <div className="text-center py-12 px-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="h-24 w-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(16,185,129,0.2)] animate-success-reveal">
                    <CheckCircle size={48} />
                </div>
                <h2 className="text-4xl font-black text-foreground mb-4 tracking-tighter">¡Inscripción Enviada!</h2>
                <p className="text-muted-foreground text-lg max-w-md mx-auto leading-relaxed font-medium">
                    Gracias por confiar en <strong>{instituteName}</strong>. Registro recibido con éxito.
                </p>
                <div className="mt-10 p-6 bg-primary/5 rounded-[2rem] text-sm border border-primary/10 inline-flex items-center gap-3 font-semibold text-primary animate-pulse">
                    <Sparkles size={18} /> Pronto nos pondremos en contacto
                </div>
            </div>
        );
    }

    return (
        <form action={handleSubmit} className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-1000 pb-4">
            <input type="hidden" name="formType" value={formType} />

            {/* ── 0. Selección de Tipo de Inscripción ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-2 bg-slate-100/50 dark:bg-slate-900/50 rounded-[2.2rem] border border-border/50">
                <button
                    type="button"
                    onClick={() => setFormType("adult")}
                    className={cn(
                        "flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] transition-all duration-500 border-2",
                        formType === "adult"
                            ? "bg-white dark:bg-slate-800 border-primary shadow-xl shadow-primary/10 scale-[1.02]"
                            : "bg-transparent border-transparent opacity-60 hover:opacity-100"
                    )}
                >
                    <div className={cn(
                        "p-3 rounded-2xl transition-colors",
                        formType === "adult" ? "bg-primary text-white" : "bg-primary/10 text-primary"
                    )}>
                        <User size={28} />
                    </div>
                    <div className="text-center">
                        <p className={cn("text-lg font-black tracking-tight", formType === "adult" ? "text-primary" : "text-foreground")}>Estudiante Adulto</p>
                        <p className="text-xs font-medium opacity-60">Uso mis propios datos</p>
                    </div>
                </button>

                <button
                    type="button"
                    onClick={() => setFormType("minor")}
                    className={cn(
                        "flex flex-col items-center justify-center gap-3 p-6 rounded-[2rem] transition-all duration-500 border-2",
                        formType === "minor"
                            ? "bg-white dark:bg-slate-800 border-emerald-500 shadow-xl shadow-emerald-500/10 scale-[1.02]"
                            : "bg-transparent border-transparent opacity-60 hover:opacity-100"
                    )}
                >
                    <div className={cn(
                        "p-3 rounded-2xl transition-colors",
                        formType === "minor" ? "bg-emerald-500 text-white" : "bg-emerald-500/10 text-emerald-500"
                    )}>
                        <Users size={28} />
                    </div>
                    <div className="text-center">
                        <p className={cn("text-lg font-black tracking-tight", formType === "minor" ? "text-emerald-500" : "text-foreground")}>Estudiante Menor</p>
                        <p className="text-xs font-medium opacity-60">Requiere tutor responsable</p>
                    </div>
                </button>
            </div>

            {/* ── 1. Datos del Alumno ── */}
            <div className="space-y-8">
                <div className="flex items-center gap-4 group">
                    <div className="p-3 bg-primary/10 rounded-2xl text-primary shadow-[0_8px_16px_-4px_rgba(59,130,246,0.2)] group-hover:scale-110 transition-transform duration-300">
                        <User size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white uppercase text-[0.85rem] opacity-50 mb-1">Paso 01</h2>
                        <p className="text-xl font-bold">Datos del Estudiante</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-7 pt-2">
                    {/* Fila 1: Nombre */}
                    <div className="flex flex-col gap-2.5 sm:col-span-2">
                        <label className="text-[0.95rem] font-bold ml-1 text-foreground/80">Nombre Completo *</label>
                        <input
                            name="name"
                            required
                            placeholder="Ej: Sofía Martínez"
                            className="w-full px-6 py-4 rounded-[1.2rem] border border-input bg-white/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/10 transition-all font-semibold text-lg h-14 shadow-sm hover:border-primary/30"
                        />
                    </div>

                    {/* Fila 2: Fecha Nacimiento y DNI */}
                    <div className="flex flex-col gap-2.5">
                        <label className="text-[0.95rem] font-bold ml-1 text-muted-foreground">Fecha de Nacimiento</label>
                        <div className="relative group/input">
                            <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within/input:text-primary transition-colors" />
                            <input
                                name="birthDate"
                                type="date"
                                className="w-full pl-14 pr-6 py-4 rounded-[1.2rem] border border-input bg-white/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/10 transition-all font-semibold h-14 [color-scheme:light] dark:[color-scheme:dark]"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2.5">
                        <label className="text-[0.95rem] font-bold ml-1 text-muted-foreground">DNI *</label>
                        <input
                            name="dni"
                            required
                            placeholder="Ej: 45123456"
                            className="w-full px-6 py-4 rounded-[1.2rem] border border-input bg-white/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/10 transition-all font-semibold h-14 shadow-sm"
                        />
                    </div>

                    {/* Fila 3: Celular y Domicilio */}
                    <div className="flex flex-col gap-2.5">
                        <label className="text-[0.95rem] font-bold ml-1 text-muted-foreground">Celular</label>
                        <div className="relative group/input">
                            <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within/input:text-primary transition-colors" />
                            <input
                                name="phone"
                                type="tel"
                                placeholder="+54 9 223 ..."
                                className="w-full pl-14 pr-6 py-4 rounded-[1.2rem] border border-input bg-white/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/10 transition-all font-semibold h-14 shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2.5">
                        <label className="text-[0.95rem] font-bold ml-1 text-muted-foreground">Domicilio</label>
                        <div className="relative group/input">
                            <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within/input:text-primary transition-colors" />
                            <input
                                name="address"
                                placeholder="Ej: Av. San Martín 1234"
                                className="w-full pl-14 pr-6 py-4 rounded-[1.2rem] border border-input bg-white/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/10 transition-all font-semibold h-14 shadow-sm"
                            />
                        </div>
                    </div>

                    {/* Fila 4: Email y Nivel */}
                    <div className="flex flex-col gap-2.5">
                        <label className="text-[0.95rem] font-bold ml-1 text-muted-foreground">Email Personal</label>
                        <div className="relative group/input">
                            <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within/input:text-primary transition-colors" />
                            <input
                                name="email"
                                type="email"
                                placeholder="ejemplo@mail.com"
                                className="w-full pl-14 pr-6 py-4 rounded-[1.2rem] border border-input bg-white/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/10 transition-all font-semibold h-14 shadow-sm"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2.5">
                        <label className="text-[0.95rem] font-bold ml-1 text-muted-foreground">Nivel a Cursar</label>
                        <div className="relative group/input">
                            <select
                                name="registeredLevel"
                                className="w-full px-6 py-4 rounded-[1.2rem] border border-input bg-white/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/10 transition-all font-semibold h-14 appearance-none shadow-sm cursor-pointer"
                            >
                                <option value="">Seleccionar nivel...</option>
                                {instituteLevels.map(level => (
                                    <option key={level.id} value={level.id}>{level.name}</option>
                                ))}
                            </select>
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">▼</div>
                        </div>
                    </div>

                    {/* Fila 5: Colegio/Turno (Solo para menores) */}
                    {formType === "minor" && (
                        <div className="flex flex-col gap-2.5 sm:col-span-2 animate-in fade-in slide-in-from-top-2">
                            <label className="text-[0.95rem] font-bold ml-1 text-muted-foreground">Colegio / Turno Actual</label>
                            <div className="relative group/input">
                                <GraduationCap className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within/input:text-primary transition-colors" />
                                <input
                                    name="schoolInfo"
                                    placeholder="Ej: Instituto San José / Turno Tarde"
                                    className="w-full pl-14 pr-6 py-4 rounded-[1.2rem] border border-input bg-white/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/10 transition-all font-semibold h-14 shadow-sm"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>


            {/* ── 2. Tutor Legal 1 (Opcional para adultos, Obligatorio para menores) ── */}
            {formType === "minor" && (
                <div className="space-y-8 pt-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-4 group">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 shadow-[0_8px_16px_-4px_rgba(16,185,129,0.2)] group-hover:scale-110 transition-transform duration-300">
                            <Users size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 uppercase text-[0.85rem] opacity-50 mb-1">Paso 02</h2>
                            <p className="text-xl font-bold">Responsable de Referencia <span className="text-sm font-normal text-muted-foreground pl-1 decoration-dotted underline underline-offset-4">(Obligatorio para menores)</span></p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-7 pt-2">
                        <div className="flex flex-col gap-2.5 sm:col-span-2">
                            <label className="text-[0.95rem] font-bold ml-1">Nombre Completo del Tutor {formType === 'minor' && "*"}</label>
                            <input
                                name="g1Name"
                                required={formType === 'minor'}
                                placeholder="Nombre del adulto responsable"
                                className="w-full px-6 py-4 rounded-[1.2rem] border border-input bg-white/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/10 transition-all font-semibold h-14 shadow-sm"
                            />
                        </div>

                        <div className="flex flex-col gap-2.5">
                            <label className="text-[0.95rem] font-bold ml-1">Vínculo / Parentesco {formType === 'minor' && "*"}</label>
                            <div className="relative">
                                <select
                                    name="g1Relation"
                                    required={formType === 'minor'}
                                    className="w-full px-6 py-4 rounded-[1.2rem] border border-input bg-white/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/10 transition-all font-semibold h-14 appearance-none shadow-sm cursor-pointer"
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="Madre">Madre</option>
                                    <option value="Padre">Padre</option>
                                    <option value="Abuelo/a">Abuelo/a</option>
                                    <option value="Tutor">Representante</option>
                                    <option value="Otro">Otro</option>
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-40">▼</div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2.5">
                            <label className="text-[0.95rem] font-bold ml-1">Teléfono Móvil {formType === 'minor' && "*"}</label>
                            <div className="relative group/input">
                                <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 group-focus-within/input:text-emerald-500 transition-colors" />
                                <input
                                    name="g1Phone"
                                    required={formType === 'minor'}
                                    type="tel"
                                    placeholder="Ej: +54 9 223 ...."
                                    className="w-full pl-14 pr-6 py-4 rounded-[1.2rem] border border-input bg-white/50 dark:bg-slate-950/50 focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-primary/10 transition-all font-semibold h-14 shadow-sm"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── 3. Tutor Legal 2 (Opcional) ── */}
            {formType === "minor" && (
                <div className="space-y-8 pt-4 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex items-center gap-4 group">
                        <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 shadow-[0_8px_16px_-4px_rgba(59,130,246,0.2)] group-hover:scale-110 transition-transform duration-300">
                            <Inbox size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black tracking-tight text-blue-600 dark:text-blue-400 uppercase text-[0.85rem] opacity-50 mb-1">Opcional</h2>
                            <p className="text-xl font-bold">Segundo Contacto de Emergencia</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-7 pt-2 p-6 md:p-10 bg-slate-500/5 dark:bg-slate-400/5 rounded-[2.5rem] border border-border/10 shadow-inner">
                        <div className="flex flex-col gap-2.5 sm:col-span-2">
                            <label className="text-[0.95rem] font-bold ml-1 opacity-70">Nombre Completo</label>
                            <input
                                name="g2Name"
                                placeholder="Nombre del segundo tutor"
                                className="w-full px-6 py-4 rounded-[1.1rem] border border-input bg-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium h-13"
                            />
                        </div>
                        <div className="flex flex-col gap-2.5">
                            <label className="text-[0.95rem] font-bold ml-1 opacity-70">Parentesco</label>
                            <div className="relative">
                                <select
                                    name="g2Relation"
                                    className="w-full px-6 py-4 rounded-[1.1rem] border border-input bg-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium h-13 appearance-none cursor-pointer"
                                >
                                    <option value="">Seleccionar...</option>
                                    <option value="Madre">Madre</option>
                                    <option value="Padre">Padre</option>
                                    <option value="Abuelo/a">Abuelo/a</option>
                                    <option value="Otro">Otro</option>
                                </select>
                                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none opacity-20">▼</div>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2.5">
                            <label className="text-[0.95rem] font-bold ml-1 opacity-70">Celular</label>
                            <div className="relative group/input">
                                <input
                                    name="g2Phone"
                                    type="tel"
                                    placeholder="+54 9 223 ..."
                                    className="w-full px-6 py-4 rounded-[1.1rem] border border-input bg-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium h-13"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="pt-12">
                {status === "error" && (
                    <div className="flex items-center gap-3 p-5 mb-8 rounded-[1.5rem] bg-red-500/10 text-red-600 dark:text-red-400 text-[0.95rem] font-bold animate-in bounce-in duration-300 border border-red-500/20">
                        <AlertCircle size={22} className="shrink-0" /> {errorMsg}
                    </div>
                )}

                <Button
                    type="submit"
                    className="w-full h-16 text-xl font-black premium-gradient shadow-[0_20px_40px_-10px_rgba(59,130,246,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 rounded-[1.7rem] uppercase tracking-wider relative overflow-hidden group"
                    disabled={isPending}
                >
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {isPending ? (
                        <div className="flex items-center gap-3">
                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Procesando...
                        </div>
                    ) : (
                        <>
                            <Heart size={24} className="fill-current text-white animate-pulse" /> Finalizar Inscripción
                        </>
                    )}
                </Button>

                <div className="flex items-center justify-center gap-2 mt-8 opacity-50">
                    <div className="h-1 w-1 bg-foreground rounded-full" />
                    <p className="text-[0.75rem] font-bold uppercase tracking-widest">
                        Sitio Seguro • Lingua Campus Engine
                    </p>
                    <div className="h-1 w-1 bg-foreground rounded-full" />
                </div>
            </div>

            <style jsx global>{`
                @keyframes success-reveal {
                    0% { transform: scale(0.5); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
                .animate-success-reveal {
                    animation: success-reveal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0) rotate(0deg); }
                    50% { transform: translateY(-30px) rotate(2deg); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 10s ease-in-out infinite;
                }
                @keyframes float {
                    0%, 100% { transform: translate(0, 0); }
                    33% { transform: translate(30px, -50px); }
                    66% { transform: translate(-20px, 20px); }
                }
                .animate-float {
                    animation: float 20s ease-in-out infinite;
                }
            `}</style>
        </form>
    );
}
