import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { AdminNavbar } from "../AdminNavbar";
import { EditInstituteForm } from "./EditInstituteForm";
import { AdminList } from "./AdminList";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";

export default async function EditInstitutePage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);

    if (!session || (session.user as any).role !== "SUPERADMIN") {
        redirect("/login");
    }

    const { id } = await params;

    const institute = await prisma.institute.findUnique({
        where: { id },
        include: {
            users: {
                where: { role: "ADMIN" }
            }
        }
    });

    if (!institute) {
        redirect("/admin/institutes");
    }

    const admins = institute.users.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email
    }));

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Navbar del admin */}
            <AdminNavbar />

            <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
                {/* Header y navegación */}
                <header className="space-y-4 mb-8">
                    <Link
                        href="/admin/institutes"
                        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a Institutos
                    </Link>

                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                            <Building2 size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                Editar Instituto
                            </h1>
                            <p className="text-sm text-primary font-semibold mt-0.5">
                                {institute.subdomain}.linguacampus.com
                            </p>
                        </div>
                    </div>
                </header>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10 items-start">
                    {/* ── Formulario de Edición ── */}
                    <div className="lg:col-span-2">
                        <Card className="shadow-md border-border/40 overflow-hidden animate-in">
                            <EditInstituteForm institute={{
                                id: institute.id,
                                name: institute.name,
                                subdomain: institute.subdomain,
                                phone: institute.phone ?? null,
                                address: institute.address ?? null,
                                status: institute.status,
                                plan: (institute as any).plan,
                                customDomain: (institute as any).customDomain,
                                pwaIcon192: (institute as any).pwaIcon192,
                                pwaIcon512: (institute as any).pwaIcon512,
                            }} />
                        </Card>
                    </div>

                    {/* ── Administradores ── */}
                    <div className="lg:col-span-1">
                        <Card className="shadow-md border-border/40 overflow-hidden animate-in h-full">
                            {/* Pasamos los Server Actions a un Client Component */}
                            <AdminList instituteId={institute.id} admins={admins} />
                        </Card>
                    </div>
                </div>
            </main>
        </div>
    );
}
