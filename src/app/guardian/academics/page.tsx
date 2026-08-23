import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { getActiveRole } from "@/lib/roles";
import { GuardianAcademicsView } from "./components/GuardianAcademicsView";
import { GUARDIAN_SECTIONS, recordActivity } from "@/lib/activity";

export default async function GuardianAcademicsPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) redirect("/login");

    const sessionUser = session.user;
    const userRoles = sessionUser.roles ?? [];
    const role = await getActiveRole(userRoles);

    // Seguridad: Sólo tutores.
    if (role !== "GUARDIAN") {
        redirect("/dashboard");
    }

    const guardianId = sessionUser.id;
    if (!guardianId) redirect("/login");

    // Leer las notas y las asistencias no deja ningún rastro en la base: sin
    // esto, la pregunta del instituto —"¿los tutores las miran?"— no tiene
    // respuesta posible (FEAT-11).
    await recordActivity({
        subjectType: "USER",
        subjectId:   guardianId,
        instituteId: sessionUser.instituteId,
        roles:       userRoles,
        section:     GUARDIAN_SECTIONS.ACADEMICS,
    });

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
                                        where: { status: "ACTIVE", date: { gte: new Date(new Date().setHours(0,0,0,0)) } },
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
                    // Sin las clases borradas: ver el comentario en academics/page.tsx
                    attendances: {
                        where: { lesson: { status: "ACTIVE" } },
                        orderBy: { lesson: { date: 'desc' } },
                        take: 30, // Mostramos un historial un poco más largo
                        include: {
                            lesson: { select: { date: true, topic: true, course: { select: { name: true, level: true, color: true } } } }
                        }
                    },
                    grades: {
                        where: { lesson: { status: "ACTIVE" } },
                        orderBy: { createdAt: 'desc' },
                        include: {
                            lesson: { select: { topic: true, course: { select: { color: true, name: true, level: true, teacher: { select: { name: true } } } } } }
                        }
                    },
                    studentReports: {
                        where: {
                            publishedAt: { lte: new Date() }
                        },
                        include: {
                            template: {
                                include: {
                                    categories: { orderBy: { order: "asc" } }
                                }
                            },
                            entries: true,
                            course: { select: { id: true, name: true, level: true, color: true, teacher: { select: { name: true } } } },
                            // Firma de conformidad (FEAT-09): a quién le toca y quién ya firmó.
                            signers: { select: { userId: true, studentId: true } },
                            signatures: { select: { userId: true, studentId: true, signedAt: true } }
                        },
                        orderBy: [{ year: "desc" }, { periodIndex: "asc" }]
                    }
                }
            }
        }
    });

    if (guardianLinks.length === 0) {
        redirect("/dashboard"); // Si no tiene alumnos o es raro, que vaya al resúmen general a ver el alerta.
    }

    const students = guardianLinks.map(l => l.student);

    // La firma de referencia es de la persona, no del alumno: un tutor con tres
    // hijos tiene una sola y le sirve para los informes de los tres.
    const signatureReference = await prisma.signatureReference.findUnique({
        where: { userId: guardianId },
        select: { strokeData: true }
    });

    return (
        <div className="min-h-screen bg-background">
            <Navbar currentActiveRole={role} />
            <GuardianAcademicsView
                students={students}
                viewerId={guardianId}
                signatureReference={signatureReference?.strokeData ?? null}
            />
        </div>
    );
}
