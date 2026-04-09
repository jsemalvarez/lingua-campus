import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { PayrollClient } from "./PayrollClient";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function PayrollPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, instituteId: true }
    });

    if (!user || user.role === "SUPERADMIN" || !user.instituteId) {
        redirect("/dashboard");
    }

    // Buscamos a los profesores activos del instituto
    const teachers = await prisma.user.findMany({
        where: {
            instituteId: user.instituteId,
            // @ts-ignore
            status: "ACTIVE",
            OR: [
                { role: "TEACHER" },
                { roles: { has: "TEACHER" } }
            ]
        },
        select: {
            id: true,
            name: true,
            email: true,
            hourlyRate: true
        },
        orderBy: { name: "asc" }
    });

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />

            <main className="container mx-auto px-4 sm:px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="mb-8">
                    <Link
                        href="/payments"
                        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a Finanzas
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight">Liquidación General de Sueldos</h1>
                    <p className="text-muted-foreground mt-1">
                        Gestiona y registra el pago de haberes para todos los docentes del instituto.
                    </p>
                </header>

                <PayrollClient teachers={teachers as any[]} />
            </main>
        </div>
    );
}
