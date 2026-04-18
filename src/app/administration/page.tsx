import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { getActiveRole } from "@/lib/roles";
import { StudentAdministrationView } from "../dashboard/components/StudentAdministrationView";

export default async function StudentAdministrationPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) redirect("/login");

    const sessionUser = session.user as any;
    const userRoles = sessionUser.roles || [sessionUser.role];
    const activeRole = await getActiveRole(userRoles);

    if (activeRole !== "STUDENT") {
        redirect("/dashboard");
    }

    const student = await prisma.student.findUnique({
        where: { id: (session.user as any).id },
        include: {
            fees: {
                orderBy: [{ year: 'desc' }, { month: 'desc' }],
                include: {
                    payments: { where: { status: "VALID" } }
                }
            }
        }
    });

    if (!student) redirect("/login");

    // Doble verificación de edad (Seguridad)
    let isMinor = false;
    if (student.birthDate) {
        const birth = new Date(student.birthDate);
        const today = new Date();
        let age = today.getFullYear() - birth.getFullYear();
        const m = today.getMonth() - birth.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        isMinor = age < 18;
    }

    if (isMinor) {
        redirect("/dashboard");
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar currentActiveRole={activeRole} />
            <StudentAdministrationView 
                student={student}
                fees={student.fees}
            />
        </div>
    );
}
