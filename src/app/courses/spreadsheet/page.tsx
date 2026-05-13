import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { getActiveRole } from "@/lib/roles";
import { SpreadsheetView } from "./SpreadsheetView";

export default async function SpreadsheetPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, instituteId: true, institute: { select: { name: true } } }
    });

    const sessionUser = session.user as any;
    const userRoles = sessionUser.roles || [user?.role || "TEACHER"];
    const activeRole = await getActiveRole(userRoles);

    if (!user || user.role === "SUPERADMIN" || !user.instituteId) {
        redirect("/dashboard");
    }

    const isAdmin = activeRole === "ADMIN" || activeRole === "SECRETARY";
    const isTeacher = activeRole === "TEACHER";

    // 1. Fetch Courses with Students
    const courses = await prisma.course.findMany({
        where: {
            instituteId: user.instituteId,
            status: "ACTIVE",
            ...(isTeacher ? { teacherId: user.id } : {})
        },
        include: {
            enrollments: {
                where: { status: "ACTIVE" },
                include: {
                    student: {
                        select: {
                            id: true,
                            name: true,
                            dni: true,
                            birthDate: true,
                            schoolInfo: true,
                            guardian1Name: true,
                            guardian1Phone: true,
                        }
                    }
                },
                orderBy: { student: { name: "asc" } }
            }
        },
        orderBy: { name: "asc" }
    });

    // 2. Fetch Students Without Course (Admin/Secretary only)
    let studentsWithoutCourse: any[] = [];
    if (isAdmin) {
        studentsWithoutCourse = await prisma.student.findMany({
            where: {
                instituteId: user.instituteId,
                status: "ACTIVE",
                enrollments: {
                    none: {
                        status: "ACTIVE"
                    }
                }
            },
            select: {
                id: true,
                name: true,
                dni: true,
                birthDate: true,
                schoolInfo: true,
                guardian1Name: true,
                guardian1Phone: true,
            },
            orderBy: { name: "asc" }
        });
    }

    const calculateAge = (birthDate: Date | null) => {
        if (!birthDate) return null;
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    // Prepare data for the client component
    const data = courses.map(course => ({
        courseName: course.name,
        students: course.enrollments.map(e => ({
            id: e.student.id,
            name: e.student.name,
            dni: e.student.dni,
            birthDate: e.student.birthDate,
            age: calculateAge(e.student.birthDate),
            schoolInfo: e.student.schoolInfo,
            guardian1Name: e.student.guardian1Name,
            guardian1Phone: e.student.guardian1Phone,
        }))
    })).filter(c => c.students.length > 0);

    if (studentsWithoutCourse.length > 0) {
        data.push({
            courseName: "Sin Curso Asignado",
            students: studentsWithoutCourse.map(s => ({
                id: s.id,
                name: s.name,
                dni: s.dni,
                birthDate: s.birthDate,
                age: calculateAge(s.birthDate),
                schoolInfo: s.schoolInfo,
                guardian1Name: s.guardian1Name,
                guardian1Phone: s.guardian1Phone,
            }))
        });
    }

    return (
        <SpreadsheetView 
            data={data} 
            activeRole={activeRole}
            instituteName={user.institute?.name || "Lingua Campus"} 
        />
    );
}
