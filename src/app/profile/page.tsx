import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { AdminNavbar } from "../admin/institutes/AdminNavbar";
import { ProfileForm } from "./ProfileForm";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { Card } from "@/components/ui/Card";
import { getActiveRole } from "@/lib/roles";
import { SignatureManager } from "@/components/reports/SignatureManager";
import type { StrokeData } from "@/lib/reports/signatureCompare";

export default async function ProfilePage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        redirect("/login");
    }

    const sessionUser = session.user;
    const userRoles = sessionUser.roles ?? [];
    const activeRole = await getActiveRole(userRoles);

    let userData: any = null;

    if (userRoles.includes("STUDENT")) {
        const student = await prisma.student.findUnique({
            where: { id: sessionUser.id },
        });
        if (student) {
            let registeredLevelName = student.registeredLevel || undefined;
            if (student.registeredLevel) {
                const level = await prisma.level.findUnique({
                    where: { id: student.registeredLevel }
                });
                if (level) registeredLevelName = level.name;
            }

            userData = {
                ...student,
                registeredLevelName,
                isStudent: true,
            };
        }
    } else {
        const user = await prisma.user.findUnique({
            where: { id: sessionUser.id },
            select: {
                name: true,
                phone: true,
                email: true,
            },
        });
        if (user) {
            userData = { ...user, isStudent: false };
        }
    }

    if (!userData) redirect("/login");

    // Para un SuperAdmin mostramos la barra de navegación del panel maestro
    const isSuperAdmin = userRoles.includes("SUPERADMIN");

    // La firma de referencia (FEAT-09/FEAT-21). El SUPERADMIN no tiene
    // instituto, así que no hay nada que firmar ni dónde guardarlo.
    const isStudent = userRoles.includes("STUDENT");
    const signatureReference = isSuperAdmin
        ? null
        : await prisma.signatureReference.findFirst({
              where: isStudent ? { studentId: sessionUser.id } : { userId: sessionUser.id },
              select: { strokeData: true, updatedAt: true }
          });

    // Para el docente y la dirección la firma sale impresa en el boletín de las
    // familias; para el tutor y el alumno es su acuse de lectura. La pantalla
    // explica una cosa o la otra, que no son lo mismo.
    const signatureAudience =
        activeRole === "ADMIN" || activeRole === "TEACHER" ? "STAFF" : "FAMILY";

    return (
        <div className="min-h-screen bg-background text-foreground">
            {isSuperAdmin ? <AdminNavbar /> : <Navbar currentActiveRole={activeRole} />}

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
                    <ProfileForm initialData={userData} />


                    {/* Formulario de Cambio de Contraseña */}
                    <ChangePasswordForm />

                    {!isSuperAdmin && (
                        <SignatureManager
                            current={(signatureReference?.strokeData as StrokeData) ?? null}
                            updatedAt={signatureReference?.updatedAt?.toISOString() ?? null}
                            audience={signatureAudience}
                        />
                    )}
                </Card>
            </main>
        </div>
    );
}
