import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { getActiveRole } from "@/lib/roles";
import { StudentAdministrationView } from "../dashboard/components/StudentAdministrationView";
import { ageOn, instituteToday } from "@/lib/dates";
import { feeStanding } from "@/lib/feeDue";

export default async function StudentAdministrationPage() {
    const session = await getServerSession(authOptions);
    // El `id` alimenta la búsqueda del alumno; sin él la consulta ni siquiera es
    // válida para Prisma.
    if (!session?.user?.id) redirect("/login");

    const sessionUser = session.user;
    const userRoles = sessionUser.roles ?? [];
    const activeRole = await getActiveRole(userRoles);

    if (activeRole !== "STUDENT") {
        redirect("/dashboard");
    }

    const student = await prisma.student.findUnique({
        where: { id: session.user.id },
        include: {
            fees: {
                orderBy: [{ year: 'desc' }, { month: 'desc' }],
                include: {
                    payments: { where: { status: "VALID" } },
                    // La fecha del examen es el vencimiento del derecho de examen.
                    enrollment: { select: { course: { select: { examDate: true } } } }
                }
            }
        }
    });

    if (!student) redirect("/login");

    // Doble verificación de edad (Seguridad)
    const isMinor = student.birthDate ? ageOn(student.birthDate) < 18 : false;

    if (isMinor) {
        redirect("/dashboard");
    }

    const today = instituteToday();

    return (
        <div className="min-h-screen bg-background">
            <Navbar currentActiveRole={activeRole} />
            {/* La vista es de cliente: dónde cae cada cuota se decide acá, con el
                mismo hoy y la misma regla que el portal de las familias. */}
            <StudentAdministrationView
                student={student}
                fees={student.fees.map(f => ({ ...f, standing: feeStanding(f, today) }))}
            />
        </div>
    );
}
