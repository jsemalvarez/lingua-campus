import prisma from "@/lib/prisma";
import { ageRangeOf, type AgeRange } from "./plan";

/**
 * El rango de edad de los alumnos activos inscriptos en el curso (PED-09). Sale
 * de la fecha de nacimiento de la ficha de cada alumno: no hay un campo de edad
 * en el curso, para que no haya otro dato que cargar y que se desactualice.
 *
 * Al prompt va sólo el rango; ningún nombre ni fecha sale de acá.
 */
export async function courseAgeRange(courseId: string): Promise<AgeRange | null> {
    const enrollments = await prisma.enrollment.findMany({
        where: { courseId, status: "ACTIVE", student: { status: "ACTIVE" } },
        select: { student: { select: { birthDate: true } } },
    });
    return ageRangeOf(enrollments.map((e) => e.student.birthDate));
}
