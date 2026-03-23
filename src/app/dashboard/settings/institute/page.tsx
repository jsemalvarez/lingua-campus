import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import prisma from "@/lib/prisma";
import { InstituteSettingsForm } from "@/features/institutes/InstituteSettingsForm";
import { Building2, ChevronRight } from "lucide-react";
import Link from "next/link";

export default async function InstituteSettingsPage() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        redirect("/login");
    }

    const user = session.user as any;

    if (user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
        redirect("/dashboard");
    }

    const instituteId = user.instituteId;

    if (!instituteId) {
        return (
            <div className="p-8 text-center bg-card rounded-2xl border border-border">
                <p className="text-muted-foreground text-sm">No perteneces a ningún instituto.</p>
            </div>
        );
    }

    const institute = await prisma.institute.findUnique({
        where: { id: instituteId }
    }) as any;

    if (!institute) {
        return (
            <div className="p-8 text-center bg-card rounded-2xl border border-border">
                <p className="text-muted-foreground text-sm">Instituto no encontrado.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Breadcrumbs / Header */}
                <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
                    <ChevronRight size={12} />
                    <span>Configuración</span>
                    <ChevronRight size={12} />
                    <span className="text-foreground">Instituto</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                        <Building2 size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Configuración del Instituto</h1>
                        <p className="text-muted-foreground text-sm font-medium">
                            Personaliza la información pública y comercial de {institute.name}.
                        </p>
                    </div>
                </div>
            </div>

            <main className="mt-8">
                <InstituteSettingsForm institute={institute} />
            </main>
            </div>
        </div>
    );
}
