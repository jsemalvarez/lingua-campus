import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { QRKioskClient } from "./QRKioskClient";
import { getActiveRole } from "@/lib/roles";

export default async function QRScannerKioskPage({
    params
}: {
    params: Promise<{ id: string, lessonId: string }>
}) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true, role: true, instituteId: true }
    });

    const sessionUser = session.user as any;
    const userRoles = sessionUser.roles || [user?.role || "TEACHER"];
    const activeRole = await getActiveRole(userRoles);

    if (!user || activeRole === "SUPERADMIN" || !user.instituteId) {
        redirect("/dashboard");
    }

    const { id: courseId, lessonId } = await params;

    const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: { teacher: { select: { id: true, name: true } } }
    });

    if (!course || course.instituteId !== user.instituteId) {
        redirect("/courses");
    }

    const isAuthorized = activeRole === "ADMIN" || activeRole === "SECRETARY" || user.id === course.teacher?.id;
    if (!isAuthorized) {
        redirect(`/courses/${courseId}`);
    }

    const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId }
    });

    if (!lesson || course.status === "FINISHED") {
        redirect(`/courses/${courseId}`);
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 selection:bg-primary/30">
            <QRKioskClient 
                courseId={courseId} 
                lessonId={lessonId} 
                courseName={course.name} 
                lessonTopic={lesson.topic} 
            />
        </div>
    );
}
