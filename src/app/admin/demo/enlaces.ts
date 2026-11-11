import prisma from "@/lib/prisma";
import { instituteBaseUrl } from "@/lib/tenant";
import type { EnlaceEnVivo } from "./recorrido";

/**
 * Las pantallas reales que abre «Verlo en vivo», todas del **Instituto Demo**:
 * el que arma `scripts/instituto-demo.js` con datos inventados. Nunca las de un
 * cliente: el que mira la demo es otro instituto, y no puede ver nombres, notas
 * ni deudas de alumnos ajenos.
 *
 * Se abren en la dirección propia del demo, con su propia sesión: ahí se entra
 * con la cuenta de la dirección del demo (`tareas/credenciales-demo.txt`), y la
 * del super admin queda en esta pestaña.
 *
 * `null` si el demo no está armado en esta base: las placas se ven igual y
 * «Verlo en vivo» avisa qué falta.
 */
export async function enlacesDeLaDemo(): Promise<Partial<Record<EnlaceEnVivo, string>> | null> {
    const instituto = await prisma.institute.findUnique({
        where: { subdomain: "demo" },
        select: { id: true, subdomain: true, customDomain: true },
    });
    if (!instituto) return null;

    const base = instituteBaseUrl(instituto);

    // La clase armada más reciente: la que el script deja con el armado, la
    // práctica publicada y la asistencia con QR.
    const clase = await prisma.lesson.findFirst({
        where: { course: { instituteId: instituto.id }, status: "ACTIVE", plan: { isNot: null } },
        orderBy: { date: "desc" },
        select: { id: true, courseId: true },
    });
    const paginaDeLaClase = clase ? `${base}/courses/${clase.courseId}/lessons/${clase.id}` : null;

    return {
        ...(paginaDeLaClase
            ? {
                  armado: `${paginaDeLaClase}#palabras`,
                  practica: `${paginaDeLaClase}#practica`,
                  asistencia: `${paginaDeLaClase}/attendance`,
              }
            : {}),
        firmas: `${base}/reports/signatures`,
        inscripcion: `${base}/inscription`,
        deudores: `${base}/payments/debtors`,
        caja: `${base}/payments`,
    };
}
