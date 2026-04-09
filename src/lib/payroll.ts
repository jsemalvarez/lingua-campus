import prisma from "@/lib/prisma";
import dayjs from "dayjs";

/**
 * Calcula las horas totales y el monto a pagar para un profesor en un rango de fechas.
 * El cálculo se basa en las lecciones registradas (Lesson) vinculadas a sus horarios (Schedule).
 */
export async function calculateTeacherPayroll(teacherId: string, startDate: Date, endDate: Date) {
    const teacher = await prisma.user.findUnique({
        where: { id: teacherId },
        select: { hourlyRate: true }
    });

    if (!teacher) throw new Error("Profesor no encontrado");
    const rate = teacher.hourlyRate || 0;

    const lessons = await prisma.lesson.findMany({
        where: {
            course: { teacherId },
            date: {
                gte: startDate,
                lte: endDate
            }
        },
        include: {
            schedule: true,
            course: true
        }
    });

    let totalMinutesUnpaid = 0;
    let unpaidCount = 0;

    const items = lessons.map(lesson => {
        let minutes = 0;
        if (lesson.schedule) {
            const start = dayjs(`2000-01-01 ${lesson.schedule.startTime}`);
            const end = dayjs(`2000-01-01 ${lesson.schedule.endTime}`);
            minutes = end.diff(start, 'minute');
        }

        const isPaid = !!lesson.expenseId;

        if (!isPaid) {
            totalMinutesUnpaid += minutes;
            unpaidCount++;
        }

        return {
            id: lesson.id,
            date: lesson.date,
            topic: lesson.topic,
            courseName: lesson.course.name,
            durationMinutes: minutes,
            amount: (minutes / 60) * rate,
            isPaid: isPaid
        };
    });

    const totalHours = totalMinutesUnpaid / 60;
    const totalAmount = totalHours * rate;

    return {
        teacherId,
        rate,
        totalHours,
        totalAmount,
        lessonCount: items.length,
        unpaidCount: unpaidCount,
        allItems: items
    };
}

/**
 * Calcula la liquidación de todos los docentes de un instituto en un solo paso.
 * Optimizado para evitar N+1 queries.
 */
export async function calculateBulkTeacherPayroll(instituteId: string, startDate: Date, endDate: Date) {
    const teachers = await prisma.user.findMany({
        where: { 
            instituteId, 
            role: "TEACHER", 
            status: "ACTIVE" 
        },
        select: { 
            id: true, 
            name: true, 
            hourlyRate: true 
        }
    });

    // Obtenemos todas las lecciones del instituto en el rango
    const lessons = await prisma.lesson.findMany({
        where: {
            course: { instituteId },
            date: {
                gte: startDate,
                lte: endDate
            }
        },
        include: {
            schedule: true,
            course: {
                select: { teacherId: true }
            }
        }
    });

    const results: Record<string, {
        teacherId: string;
        rate: number;
        totalHours: number;
        totalAmount: number;
        lessonCount: number;
        unpaidCount: number;
    }> = {};

    // Inicializar mapa de resultados
    teachers.forEach(t => {
        results[t.id] = {
            teacherId: t.id,
            rate: t.hourlyRate || 0,
            totalHours: 0,
            totalAmount: 0,
            lessonCount: 0,
            unpaidCount: 0
        };
    });

    // Procesar lecciones
    lessons.forEach(lesson => {
        const tId = lesson.course.teacherId;
        if (!tId || !results[tId]) return;

        // Solo procesamos lecciones que no han sido pagadas
        if (lesson.expenseId) return;

        let minutes = 0;
        if (lesson.schedule) {
            const start = dayjs(`2000-01-01 ${lesson.schedule.startTime}`);
            const end = dayjs(`2000-01-01 ${lesson.schedule.endTime}`);
            minutes = end.diff(start, 'minute');
        }

        results[tId].lessonCount++;
        results[tId].totalHours += minutes / 60;
    });

    // Calcular montos finales
    Object.keys(results).forEach(id => {
        results[id].totalAmount = results[id].totalHours * results[id].rate;
    });

    return results;
}

