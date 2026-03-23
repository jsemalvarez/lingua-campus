import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { AdminNavbar } from "../admin/institutes/AdminNavbar";
import { ProfileForm } from "./ProfileForm";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { Card } from "@/components/ui/Card";

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
        redirect("/login");
    }

    const role = (session.user as any).role;
    let userData: any = null;

    if (role === "STUDENT") {
        const student = await prisma.student.findFirst({
            where: { email: session.user.email },
        });
        if (student) {
            userData = {
                name: student.name,
                phone: student.phone,
                email: student.email,
                role: "STUDENT",
            };
        }
    } else {
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
            select: {
                name: true,
                phone: true,
                email: true,
                role: true,
            },
        });
        if (user) {
            userData = user;
        }
    }

    if (!userData) redirect("/login");

    // Para un SuperAdmin mostramos la barra de navegación del panel maestro
    const isSuperAdmin = role === "SUPERADMIN";

    return (
        <div className="min-h-screen bg-background text-foreground">
            {isSuperAdmin ? <AdminNavbar /> : <Navbar />}

            <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-3xl">
                <header className="mb-8 space-y-1">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                        Mi Perfil
                    </h1>
                    <p className="text-sm sm:text-base text-muted-foreground">
                        Administra tu información personal y la seguridad de tu cuenta.
                    </p>
                </header>

                <Card className="p-5 sm:p-8 border-border/40 shadow-sm animate-in">
                    <ProfileForm initialData={{
                        name: userData.name,
                        phone: userData.phone,
                        email: userData.email,
                        role: userData.role,
                    }} />

                    {/* Formulario de Cambio de Contraseña */}
                    <ChangePasswordForm />
                </Card>
            </main>
        </div>
    );
}
