"use client";

import { useTransition, useState } from "react";
import { updateInstituteByAdminAction } from "@/features/institutes/actions";
import { Button } from "@/components/ui/Button";
import { CheckCircle, AlertCircle, Globe, Mail, Phone, MapPin, MessageSquare, Facebook, Instagram, Image as ImageIcon, AlignLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface InstituteSettingsFormProps {
    institute: {
        id: string;
        name: string;
        email: string | null;
        phone: string | null;
        address: string | null;
        description: string | null;
        logoUrl: string | null;
        facebookUrl: string | null;
        instagramUrl: string | null;
        whatsappNumber: string | null;
    };
}

export function InstituteSettingsForm({ institute }: InstituteSettingsFormProps) {
    const [isPending, startTransition] = useTransition();
    const [statusFeedback, setStatusFeedback] = useState<"idle" | "success" | "error">("idle");
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (formData: FormData) => {
        setStatusFeedback("idle");
        formData.append("id", institute.id);

        startTransition(async () => {
            const result = await updateInstituteByAdminAction(formData);
            if (result.success) {
                setStatusFeedback("success");
                setTimeout(() => setStatusFeedback("idle"), 3000);
            } else {
                setStatusFeedback("error");
                setErrorMsg(result.error ?? "Error al actualizar los datos");
            }
        });
    };

    return (
        <form action={handleSubmit} className="space-y-8 animate-in fade-in duration-500">
            {/* --- Sección: Información Básica --- */}
            <div className="bg-card/50 border border-border/50 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-border/50 bg-muted/30">
                    <h3 className="text-base font-bold flex items-center gap-2">
                        <Globe className="text-primary" size={18} />
                        Información Básica
                    </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5 md:col-span-2">
                        <label className="text-sm font-semibold flex items-center gap-2">Nombre del Instituto</label>
                        <input
                            name="name"
                            defaultValue={institute.name}
                            placeholder="Ej: Oxford Institute"
                            className="w-full px-4 py-2.5 rounded-xl border border-input bg-background/50 text-sm focus:ring-2 focus:ring-ring/30 transition-all font-medium outline-none hover:border-primary/30"
                            required
                        />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                        <label className="text-sm font-semibold flex items-center gap-2">
                            <AlignLeft size={16} /> Descripción / Slogan
                        </label>
                        <textarea
                            name="description"
                            defaultValue={institute.description ?? ""}
                            placeholder="Breve descripción del instituto o slogan promocional..."
                            className="w-full px-4 py-2.5 rounded-xl border border-input bg-background/50 text-sm focus:ring-2 focus:ring-ring/30 transition-all font-medium outline-none hover:border-primary/30 min-h-[100px] py-3"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold flex items-center gap-2">
                            <Mail size={16} /> Email de Contacto
                        </label>
                        <input
                            name="email"
                            type="email"
                            defaultValue={institute.email ?? ""}
                            placeholder="info@tuinstituto.com"
                            className="w-full px-4 py-2.5 rounded-xl border border-input bg-background/50 text-sm focus:ring-2 focus:ring-ring/30 transition-all font-medium outline-none hover:border-primary/30"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold flex items-center gap-2">
                            <Phone size={16} /> Teléfono Comercial
                        </label>
                        <input
                            name="phone"
                            defaultValue={institute.phone ?? ""}
                            placeholder="+54 9 11 1234 5678"
                            className="w-full px-4 py-2.5 rounded-xl border border-input bg-background/50 text-sm focus:ring-2 focus:ring-ring/30 transition-all font-medium outline-none hover:border-primary/30"
                        />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                        <label className="text-sm font-semibold flex items-center gap-2">
                            <MapPin size={16} /> Dirección Física
                        </label>
                        <input
                            name="address"
                            defaultValue={institute.address ?? ""}
                            placeholder="Av. Santa Fe 1234, CABA"
                            className="w-full px-4 py-2.5 rounded-xl border border-input bg-background/50 text-sm focus:ring-2 focus:ring-ring/30 transition-all font-medium outline-none hover:border-primary/30"
                        />
                    </div>

                    <div className="space-y-1.5 md:col-span-2">
                        <label className="text-sm font-semibold flex items-center gap-2">
                            <ImageIcon size={16} /> URL del Logo
                        </label>
                        <input
                            name="logoUrl"
                            defaultValue={institute.logoUrl ?? ""}
                            placeholder="https://example.com/logo.png"
                            className="w-full px-4 py-2.5 rounded-xl border border-input bg-background/50 text-sm focus:ring-2 focus:ring-ring/30 transition-all font-medium outline-none hover:border-primary/30"
                        />
                        <p className="text-[12px] text-muted-foreground mt-1">Sugerencia: Usa una imagen con fondo transparente (PNG).</p>
                    </div>
                </div>
            </div>

            {/* --- Sección: Redes Sociales y WhatsApp --- */}
            <div className="bg-card/50 border border-border/50 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-6 py-4 border-b border-border/50 bg-muted/30">
                    <h3 className="text-base font-bold flex items-center gap-2">
                        <MessageSquare className="text-primary" size={18} />
                        Redes Sociales y WhatsApp
                    </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold flex items-center gap-2">
                            <Facebook className="text-blue-600" size={16} /> Facebook URL
                        </label>
                        <input
                            name="facebookUrl"
                            defaultValue={institute.facebookUrl ?? ""}
                            placeholder="facebook.com/tu_instituto"
                            className="w-full px-4 py-2.5 rounded-xl border border-input bg-background/50 text-sm focus:ring-2 focus:ring-ring/30 transition-all font-medium outline-none hover:border-primary/30"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold flex items-center gap-2">
                            <Instagram className="text-pink-600" size={16} /> Instagram URL
                        </label>
                        <input
                            name="instagramUrl"
                            defaultValue={institute.instagramUrl ?? ""}
                            placeholder="instagram.com/tu_instituto"
                            className="w-full px-4 py-2.5 rounded-xl border border-input bg-background/50 text-sm focus:ring-2 focus:ring-ring/30 transition-all font-medium outline-none hover:border-primary/30"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-sm font-semibold flex items-center gap-2 text-emerald-600">
                            WhatsApp Número (Solo Números)
                        </label>
                        <input
                            name="whatsappNumber"
                            defaultValue={institute.whatsappNumber ?? ""}
                            placeholder="5491112345678 (Sin el +)"
                            className="w-full px-4 py-2.5 rounded-xl border border-input bg-background/50 text-sm focus:ring-2 focus:ring-ring/30 transition-all font-medium outline-none hover:border-primary/30 border-emerald-500/30 focus:border-emerald-500/50"
                        />
                    </div>
                </div>
            </div>

            {/* Feedback & Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/50">
                <div className="w-full sm:w-auto">
                    {statusFeedback === "success" && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-sm font-medium animate-in slide-in-from-left">
                            <CheckCircle size={16} /> Cambios guardados correctamente.
                        </div>
                    )}
                    {statusFeedback === "error" && (
                        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 text-sm font-medium animate-in slide-in-from-left">
                            <AlertCircle size={16} /> {errorMsg}
                        </div>
                    )}
                </div>

                <Button type="submit" size="lg" className="premium-gradient shadow-md w-full sm:w-auto" disabled={isPending}>
                    {isPending ? "Guardando..." : "Guardar Cambios"}
                </Button>
            </div>
        </form>
    );
}
