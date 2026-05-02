import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { getActiveRole } from "@/lib/roles";
import { GuardianAcademicsView } from "./components/GuardianAcademicsView";

export default async function GuardianAcademicsPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) redirect("/login");

    const sessionUser = session.user as any;
    const userRoles = sessionUser.roles || [sessionUser.role];
    const role = await getActiveRole(userRoles);

    // Seguridad: Sólo tutores.
    if (role !== "GUARDIAN") {
        redirect("/dashboard");
    }

    const guardianId = sessionUser.id;

    // Fetch master relation
    const guardianLinks = await prisma.guardianStudentLink.findMany({
        where: { guardianId },
        include: {
            student: {
                select: {
                    id: true,
                    name: true,
                    institute: { select: { name: true } },
                    enrollments: {
                        where: { status: "ACTIVE" },
                        include: {
                            course: {
                                select: {
                                    id: true,
                                    name: true,
                                    level: true,
                                    color: true,
                                    startDate: true,
                                    endDate: true,
                                    teacher: {
                                        select: { name: true }
                                    },
                                    lessons: {
                                        where: { date: { gte: new Date(new Date().setHours(0,0,0,0)) } },
                                        orderBy: { date: 'asc' },
                                        take: 10,
                                        select: { 
                                            id: true, 
                                            date: true, 
                                            topic: true, 
                                            schedule: { select: { startTime: true, endTime: true } }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    attendances: {
                        orderBy: { lesson: { date: 'desc' } },
                        take: 30, // Mostramos un historial un poco más largo
                        include: {
                            lesson: { select: { date: true, topic: true, course: { select: { name: true, color: true } } } }
                        }
                    },
                    grades: {
                        orderBy: { createdAt: 'desc' },
                        include: {
                            lesson: { select: { topic: true, course: { select: { color: true, name: true, teacher: { select: { name: true } } } } } }
                        }
                    }
                }
            }
        }
    });

    if (guardianLinks.length === 0) {
        redirect("/dashboard"); // Si no tiene alumnos o es raro, que vaya al resúmen general a ver el alerta.
    }

    const students = guardianLinks.map(l => l.student);

    return (
        <div className="min-h-screen bg-background">
            <Navbar currentActiveRole={role} />
            <GuardianAcademicsView students={students} />
        </div>
    );
}
