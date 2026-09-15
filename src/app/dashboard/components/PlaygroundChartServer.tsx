import prisma from "@/lib/prisma";
import { PlaygroundActivityChart } from "./PlaygroundActivityChart";

/**
 * Resumen de práctica para el Panel de Control (FEAT-16).
 *
 * **Acá quedó sólo la mitad que contesta "cómo va el instituto".** La actividad
 * —sesiones por día y reparto por tipo— se mudó al panel de uso, al lado del
 * mosaico que mide lo que el docente publicó: separadas, ninguna de las dos se
 * podía interpretar sola.
 *
 * Se queda la precisión por curso, que no mide uso sino aprendizaje, y un número
 * grande para que el Playground —que es el diferencial del producto— siga
 * visible en la pantalla que se abre todos los días. Es además lo único de esto
 * que necesita la secretaría, que queda afuera del panel de uso por SEC-03.
 *
 * **Una consulta y agregada en la base.** Antes eran dos `findMany` que traían
 * las mismas sesiones de 30 días para calcular dos cosas distintas, y después las
 * recorrían en memoria.
 */

interface CourseAccuracy {
    name: string;
    accuracy: number;
    sessions: number;
    color: string;
}

export async function PlaygroundChartServer({ instituteId }: { instituteId: string }) {
    // Sin filtrar por estado de la clase, a propósito: acá se mide lo que el
    // alumno hizo, y que el docente después borre la clase no lo deshace.
    const rows = await prisma.$queryRaw<
        { nombre: string; color: string; accuracy: number; sessions: number }[]
    >`
        -- El nombre del curso y no su nivel. El nivel se repite entre secciones
        -- —hay dos "Pre-adolescents 1" y dos "Upper-intermediate"— y en una
        -- tabla eso se tolera porque al lado hay una fecha que desambigua, pero
        -- acá la etiqueta **es** la identidad de la barra: dos barras iguales
        -- con números distintos se leen como un error del gráfico.
        SELECT c.name                                             AS nombre,
               c.color                                            AS color,
               ROUND(AVG(ps."accuracyPct")::numeric, 1)::float8   AS accuracy,
               COUNT(*)::int                                      AS sessions
          FROM "PracticeSession" ps
          JOIN "Lesson" l ON l.id = ps."lessonId"
          JOIN "Course" c ON c.id = l."courseId"
         WHERE c."instituteId" = ${instituteId}
           AND ps."completedAt" >= NOW() - INTERVAL '30 days'
         GROUP BY c.id, nombre, c.color
         ORDER BY sessions DESC
    `;

    const totalSessions = rows.reduce((acc, r) => acc + r.sessions, 0);

    // Máximo 8 cursos para no saturar el gráfico. El total se calcula antes de
    // recortar: es el total del instituto, no el de los ocho que se dibujan.
    const courseData: CourseAccuracy[] = rows.slice(0, 8).map((r) => ({
        name: r.nombre,
        accuracy: r.accuracy ?? 0,
        sessions: r.sessions,
        color: r.color,
    }));

    return <PlaygroundActivityChart courseData={courseData} totalSessions={totalSessions} />;
}
