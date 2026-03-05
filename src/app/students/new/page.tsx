import { getServerSession } from "next-auth";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { StudentForm } from "./StudentForm";
import Link from "next/link";
import { ArrowLeft, UserPlus } from "lucide-react";

export default async function NewStudentPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />

            <main className="container mx-auto px-4 sm:px-6 py-8">
                {/* Header y navegación */}
                <header className="mb-8">
                    <Link
                        href="/students"
                        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a estudiantes
                    </Link>

                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl premium-gradient flex items-center justify-center text-white shadow-md">
                            <UserPlus size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                Nueva Inscripción
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1">
                                Ingresa los datos personales del alumno y sus tutores legales.
                            </p>
                        </div>
                    </div>
                </header>

                <div className="max-w-4xl">
                    <Card className="border-border/40 shadow-sm">
                        <StudentForm />
                    </Card>
                </div>
            </main>
        </div>
    );
}
