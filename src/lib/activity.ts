import prisma from "@/lib/prisma";

/**
 * Registro de actividad para el panel de uso (FEAT-11).
 *
 * **Por qué existe.** Hoy el sistema no guarda ninguna fecha de ingreso: ni
 * `User` ni `Student` tienen último acceso, no hay tabla de accesos, y
 * `authorize()` valida la contraseña sin escribir nada. Lo que no se registre a
 * partir de ahora se pierde; las demás métricas del panel se reconstruyen hacia
 * atrás el día que se haga la pantalla.
 *
 * **Qué mide, y qué no.** `logins` cuenta veces que alguien tipeó la contraseña,
 * que con un JWT de 30 días **no** es una medida de uso. Lo que mide uso es
 * `lastSeenAt`, que se refresca mientras la persona está usando la aplicación.
 * La distinción importa: si el panel titula "ingresos" lo que en realidad son
 * sesiones vencidas, el instituto va a concluir que los tutores no entran.
 *
 * **Nunca puede romper lo que envuelve.** Esto es contabilidad, no
 * funcionalidad: todas las escrituras se tragan sus errores. Un problema en el
 * registro no puede llevarse puesto un login ni una pantalla.
 */

export type ActivitySubject = "USER" | "STUDENT";

/**
 * Las secciones del portal del tutor. Son pocas y cerradas a propósito: esto no
 * es instrumentar la aplicación —esa mitad es un proyecto entero, anotado en
 * FEAT-11—, es instrumentar las tres pantallas donde vive la pregunta del
 * cliente.
 */
export const GUARDIAN_SECTIONS = {
    HOME: "GUARDIAN_HOME",
    ACADEMICS: "GUARDIAN_ACADEMICS",
    PAYMENTS: "GUARDIAN_PAYMENTS",
} as const;

export type ActivitySection = (typeof GUARDIAN_SECTIONS)[keyof typeof GUARDIAN_SECTIONS];

/**
 * El día se corta con el calendario del instituto, no con el del servidor.
 * Vercel y Supabase corren en UTC: sin esto, todo lo que pasa después de las
 * 21:00 de Argentina caería en el día siguiente, y el gráfico diario mostraría
 * las noches corridas un casillero.
 *
 * Está fijo porque hoy hay un solo instituto y es argentino. El día que haya uno
 * en otro huso, esto sale de acá y pasa a ser un campo de `Institute`.
 */
export const INSTITUTE_TIME_ZONE = "America/Argentina/Buenos_Aires";

/**
 * La fecha del calendario del instituto, a medianoche UTC — que es como
 * Postgres guarda un `@db.Date`. `en-CA` da directamente `YYYY-MM-DD`, así que
 * no hace falta una librería de fechas para esto.
 *
 * Se exporta para que el panel de uso recorte sus períodos con **el mismo hoy**
 * con el que se escribe la actividad. Si cada lado calculara el suyo, el último
 * día del rango podría no coincidir con el último día registrado.
 */
export function instituteToday(): Date {
    const ymd = new Intl.DateTimeFormat("en-CA", {
        timeZone: INSTITUTE_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).format(new Date());

    return new Date(`${ymd}T00:00:00.000Z`);
}

interface RecordInput {
    subjectType: ActivitySubject;
    /**
     * Se acepta vacío a propósito. En varias pantallas el `id` de la sesión
     * llega como `string | undefined` y el guardia de arriba ya redirigió; que
     * el registro obligue a estrecharlo sería hacer que la contabilidad le
     * cambie la forma al código que mide.
     */
    subjectId: string | null | undefined;
    instituteId?: string | null;
    /** Los roles de la persona ese día. Los alumnos van con `["STUDENT"]`. */
    roles: string[];
    /** `true` sólo cuando la persona acaba de validar sus credenciales. */
    isLogin?: boolean;
    /** La sección que está abriendo, si es una de las del portal del tutor. */
    section?: ActivitySection;
}

/**
 * Deja constancia de que esta persona estuvo activa hoy.
 *
 * En el caso común es **una sola sentencia**: el `upsert` crea la fila del día o
 * le corre `lastSeenAt`. La segunda sólo aparece la primera vez que alguien abre
 * una sección determinada en el día, y no vuelve a aparecer hasta mañana.
 */
export async function recordActivity({
    subjectType,
    subjectId,
    instituteId,
    roles,
    isLogin = false,
    section,
}: RecordInput): Promise<void> {
    if (!subjectId) return;

    const day = instituteToday();
    const where = { subjectType_subjectId_day: { subjectType, subjectId, day } };
    const now = new Date();

    try {
        const row = await prisma.activityDay.upsert({
            where,
            create: {
                subjectType,
                subjectId,
                instituteId: instituteId ?? null,
                day,
                roles,
                logins: isLogin ? 1 : 0,
                sections: section ? [section] : [],
                firstSeenAt: now,
                lastSeenAt: now,
            },
            update: {
                // Los roles se pisan con los de hoy: si a alguien le sumaron un
                // rol, la fila del día tiene que reflejar con qué entró.
                roles,
                instituteId: instituteId ?? null,
                lastSeenAt: now,
                ...(isLogin ? { logins: { increment: 1 } } : {}),
            },
        });

        // Se agrega la sección sólo si falta. Dos pedidos simultáneos podrían
        // agregarla dos veces; es inofensivo, la pantalla la muestra una vez.
        if (section && !row.sections.includes(section)) {
            await prisma.activityDay.update({
                where,
                data: { sections: { push: section } },
            });
        }
    } catch {
        // Ver el encabezado: el registro nunca puede romper lo que envuelve.
        // Perder una fila de actividad no le cambia el día a nadie.
    }
}
