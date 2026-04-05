import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { ArrowLeft } from "lucide-react";
import { GuardianProfileView } from "./GuardianProfileView";

export default async function GuardianDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, roles: true, instituteId: true }
    }) as any;

    const isAdmin = user?.roles?.includes("ADMIN") || user?.roles?.includes("SUPERADMIN") || user?.role === "ADMIN" || user?.role === "SUPERADMIN";

    if (!user || !isAdmin || !user.instituteId) {
        redirect("/dashboard");
    }

    const { id } = await params;

    const guardian = await prisma.user.findUnique({
        where: { id: id },
        include: {
            guardianLinks: {
                include: { student: true }
            }
        }
    });

    // Validar que exista, pertenezca al instituto y tenga el rol GUARDIAN
    if (!guardian || guardian.instituteId !== user.instituteId || !guardian.roles.includes("GUARDIAN" as any)) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />

            <main className="container mx-auto px-4 sm:px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="mb-8">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al inicio
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">Ficha del Tutor</h1>
                </header>

                <GuardianProfileView guardian={guardian as any} />
            </main>
        </div>
    );
}
