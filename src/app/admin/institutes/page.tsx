import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PrismaInstituteRepository } from "@/features/superadmin/infrastructure/prisma/PrismaInstituteRepository";
import { CreateInstituteForm } from "./CreateInstituteForm";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Building2, Mail, LayoutDashboard, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import { AdminNavbar } from "./AdminNavbar";

export default async function AdminInstitutesPage() {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "SUPERADMIN") {
        redirect("/login");
    }

    const repo = new PrismaInstituteRepository();
    const institutes = await repo.findAll();

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Navbar del admin — componente cliente para tener el ThemeToggle */}
            <AdminNavbar />

            <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
                {/* Header */}
                <header className="space-y-1">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                        Gestión de Institutos
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Panel Maestro: crea institutos y asigna sus administradores.
                    </p>
                </header>

                {/* Layout: formulario encima en mobile, lado a lado en lg */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10 items-start">

                    {/* ── Formulario (sticky en desktop) ── */}
                    <div className="lg:col-span-1">
                        <Card className="shadow-md border-border/40 lg:sticky lg:top-24">
                            <CreateInstituteForm />
                        </Card>
                    </div>

                    {/* ── Lista de institutos ── */}
                    <div className="lg:col-span-2 space-y-5">
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg sm:text-xl font-bold">Institutos Activos</h2>
                            <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                                {institutes.length}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                            {institutes.map((inst) => (
                                <Card key={inst.id} className="hover:shadow-md transition-all border-border/40 group overflow-hidden relative">
                                    {/* Icono decorativo de fondo */}
                                    <div className="absolute top-0 right-0 p-3 opacity-[0.07] group-hover:opacity-[0.12] transition-opacity pointer-events-none">
                                        <Building2 size={72} />
                                    </div>

                                    <div className="relative z-10 flex flex-col gap-3">
                                        <div>
                                            <h3 className="text-base sm:text-lg font-bold leading-tight">{inst.name}</h3>
                                            <p className="text-xs sm:text-sm text-primary font-medium mt-0.5">
                                                {inst.subdomain}.linguacampus.com
                                            </p>
                                        </div>

                                        <div className="flex flex-col gap-1.5 mt-1">
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Mail size={12} />
                                                <span>Admin gestionado por cliente</span>
                                            </div>
                                            {inst.phone && (
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Phone size={12} />
                                                    <span>{inst.phone}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between mt-1">
                                            <span className={`text-[10px] uppercase font-bold tracking-widest px-2 py-1 rounded-md ${inst.status === "ACTIVE" ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50" : "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50"}`}>
                                                {inst.status === "ACTIVE" ? "Activo" : "Inactivo"}
                                            </span>

                                            {/* Link a la página de edición en lugar del Modal */}
                                            <Link href={`/admin/institutes/${inst.id}`}>
                                                <Button size="sm" className="h-7 px-3 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-md shadow-sm transition-all hover:shadow-primary/20">
                                                    Administrar
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                </Card>
                            ))}

                            {institutes.length === 0 && (
                                <div className="col-span-full py-16 sm:py-20 text-center border-2 border-dashed border-border/50 rounded-2xl sm:rounded-3xl">
                                    <Building2 size={40} className="mx-auto mb-3 text-muted-foreground/40" />
                                    <p className="text-muted-foreground italic text-sm">
                                        No hay institutos creados. Usá el panel de la izquierda.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
