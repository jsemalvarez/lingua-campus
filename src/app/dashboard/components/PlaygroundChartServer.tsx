import prisma from "@/lib/prisma";
import { PlaygroundActivityChart } from "./PlaygroundActivityChart";

interface PlaygroundChartServerProps {
    instituteId: string;
}

export async function PlaygroundChartServer({ instituteId }: PlaygroundChartServerProps) {
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    // ── 1. Sesiones por día (últimos 30 días, agrupadas por fecha y tipo) ──
    const recentSessions = await prisma.practiceSession.findMany({
        where: {
            lesson: { course: { instituteId } },
            completedAt: { gte: thirtyDaysAgo },
        },
        select: {
            completedAt: true,
            type: true,
            accuracyPct: true,
        },
        orderBy: { completedAt: 'asc' },
    });

    // Generar mapa de los últimos 30 días
    const dayMap: Record<string, { date: string; SPEAKING: number; LISTENING: number; CHAT: number }> = {};
    for (let i = 0; i < 30; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - (29 - i));
        const key = d.toISOString().split('T')[0]; // "YYYY-MM-DD"
        const label = d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' });
        dayMap[key] = { date: label, SPEAKING: 0, LISTENING: 0, CHAT: 0 };
    }

    recentSessions.forEach(s => {
        const key = s.completedAt.toISOString().split('T')[0];
        if (dayMap[key]) {
            dayMap[key][s.type] += 1;
        }
    });

    const dailyData = Object.values(dayMap);

    // ── 2. Total por tipo (últimos 30 días) ──
    const typeCounts = { SPEAKING: 0, LISTENING: 0, CHAT: 0 };
    recentSessions.forEach(s => {
        typeCounts[s.type] += 1;
    });

    const typeData = [
        { name: 'Speaking', value: typeCounts.SPEAKING, color: '#8b5cf6' },
        { name: 'Listening', value: typeCounts.LISTENING, color: '#f59e0b' },
        { name: 'Chat', value: typeCounts.CHAT, color: '#10b981' },
    ].filter(d => d.value > 0);

    // ── 3. Accuracy promedio por curso ──
    const courseAccuracyRaw = await prisma.practiceSession.findMany({
        where: {
            lesson: { course: { instituteId } },
            completedAt: { gte: thirtyDaysAgo },
        },
        select: {
            accuracyPct: true,
            lesson: {
                select: {
                    course: {
                        select: {
                            id: true,
                            name: true,
                            color: true,
                        }
                    }
                }
            }
        }
    });

    // Agrupar por curso
    const courseMap: Record<string, { name: string; color: string; total: number; count: number }> = {};
    courseAccuracyRaw.forEach(s => {
        const course = s.lesson.course;
        if (!courseMap[course.id]) {
            courseMap[course.id] = { name: course.level || course.name, color: course.color, total: 0, count: 0 };
        }
        courseMap[course.id].total += s.accuracyPct;
        courseMap[course.id].count += 1;
    });

    const courseData = Object.values(courseMap)
        .map(c => ({
            name: c.name,
            accuracy: parseFloat((c.total / c.count).toFixed(1)),
            sessions: c.count,
            color: c.color,
        }))
        .sort((a, b) => b.sessions - a.sessions)
        .slice(0, 8); // Máximo 8 cursos para no saturar el gráfico

    const totalSessions = recentSessions.length;

    return (
        <PlaygroundActivityChart
            dailyData={dailyData}
            typeData={typeData}
            courseData={courseData}
            totalSessions={totalSessions}
        />
    );
}
