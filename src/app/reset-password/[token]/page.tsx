import Link from "next/link";
import { headers } from "next/headers";
import { getTenantByHost } from "@/lib/tenant";
import { findResetSubject } from "@/lib/passwordReset";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { AlertCircle, Clock, CheckCheck } from "lucide-react";
import ResetPasswordForm from "./ResetPasswordForm";
import type { Metadata } from "next";

// La marca la agrega el `template` del layout, que ya la resuelve por instituto.
export const metadata: Metadata = {
    title: "Nueva contraseña",
};

/** Lo que se le dice a la persona según por qué no sirve el enlace. */
const MOTIVOS = {
    invalid: {
        icono: AlertCircle,
        titulo: "Enlace inválido",
        detalle: "Este enlace no corresponde a ningún pedido. Revisá que lo hayas copiado entero.",
        color: "text-red-500 bg-red-500/10",
    },
    expired: {
        icono: Clock,
        titulo: "El enlace venció",
        detalle: "Los enlaces duran una hora por seguridad. Pedí uno nuevo y te llega al toque.",
        color: "text-amber-500 bg-amber-500/10",
    },
    used: {
        icono: CheckCheck,
        titulo: "Este enlace ya se usó",
        detalle: "La contraseña ya se cambió con este enlace. Si no fuiste vos, pedí uno nuevo.",
        color: "text-slate-500 bg-slate-500/10",
    },
} as const;

export default async function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params;
    const headersList = await headers();

    const institute = await getTenantByHost(headersList.get("host") || "");
    const lookup = await findResetSubject(token);

    const brandName = institute ? institute.name : "Lingua Campus";

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative bg-background text-foreground overflow-hidden">
            <div className="absolute top-4 right-4 z-50">
                <ThemeToggle variant="full" />
            </div>

            {/* Background decoration */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute -top-40 -right-40 w-[30rem] h-[30rem] bg-primary/10 dark:bg-primary/5 rounded-full blur-[100px]" />
                <div className="absolute -bottom-40 -left-40 w-[30rem] h-[30rem] bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[100px]" />
            </div>

            <Card className="max-w-md w-full p-8 shadow-2xl shadow-primary/5 border-border/40 relative glass animate-in">
                {lookup.valid ? (
                    <ResetPasswordForm token={token} subjectName={lookup.name} brandName={brandName} />
                ) : (
                    (() => {
                        const motivo = MOTIVOS[lookup.reason];
                        const Icono = motivo.icono;

                        return (
                            <div className="text-center space-y-6">
                                <div className={`h-16 w-16 rounded-2xl mx-auto flex items-center justify-center ${motivo.color}`}>
                                    <Icono size={32} />
                                </div>

                                <div className="space-y-2">
                                    <h1 className="text-2xl font-extrabold tracking-tight">{motivo.titulo}</h1>
                                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                        {motivo.detalle}
                                    </p>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <Link href="/forgot-password" className="block">
                                        <Button className="premium-gradient w-full h-12 font-bold">
                                            Pedir un enlace nuevo
                                        </Button>
                                    </Link>
                                    <Link href="/login" className="block">
                                        <Button variant="ghost" className="w-full h-11 font-semibold text-muted-foreground">
                                            Volver al inicio de sesión
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        );
                    })()
                )}

                <div className="mt-8 pt-6 border-t border-border/50 text-center">
                    <p className="text-xs font-medium text-muted-foreground">
                        {brandName} &copy; {new Date().getFullYear()}
                    </p>
                </div>
            </Card>
        </div>
    );
}
