import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { QRKioskClient } from "./QRKioskClient";

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

    if (!user || user.role === "SUPERADMIN" || !user.instituteId) {
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
