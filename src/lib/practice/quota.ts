import prisma from "@/lib/prisma";

/**
 * Límite de uso de los proveedores de IA (SEC-07).
 *
 * Se cuenta en dos escalas porque protegen cosas distintas:
 *
 * - **Por usuario, por hora.** Que un alumno con la consola abierta no pueda
 *   vaciar la cuota del instituto en un minuto.
 * - **Por instituto, por día.** Es el techo que importa para la factura. El free
 *   tier de Gemini son 1500 requests diarias para *todo* el proyecto, así que un
 *   tope horario por instituto no serviría de nada: con seis horas de uso
 *   normal ya se pasaría.
 *
 * SUPERADMIN no tiene instituto, así que sólo se le cuenta el tope de usuario.
 */

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

/**
 * Una sesión de speaking gasta dos llamadas por frase (audio + evaluación) más
 * la generación; una de listening, una por escucha más el cuestionario. Un
 * alumno aplicado ronda las 60 en una hora, así que 150 le deja margen y a la
 * vez corta el loop automatizado.
 */
const DEFAULT_USER_HOURLY = 150;

/** Por debajo del free tier diario, que es compartido por todos los institutos. */
const DEFAULT_INSTITUTE_DAILY = 1200;

function limitFromEnv(name: string, fallback: number): number {
    const raw = Number(process.env[name]);
    return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : fallback;
}

/** Inicio de la ventana que contiene a `now`, alineado al tamaño del período. */
function windowStart(now: number, sizeMs: number): Date {
    return new Date(Math.floor(now / sizeMs) * sizeMs);
}

/**
 * Incrementa el contador y devuelve el valor ya incrementado.
 *
 * El `upsert` es atómico salvo por la carrera en la que dos llamadas simultáneas
 * no encuentran la fila y las dos intentan crearla: una gana y la otra choca con
 * el índice único. En ese caso alcanza con reintentar el incremento, que ahora
 * sí encuentra la fila.
 */
async function bump(subjectType: string, subjectId: string, start: Date): Promise<number> {
    const where = {
        subjectType_subjectId_windowStart: { subjectType, subjectId, windowStart: start },
    };

    try {
        const row = await prisma.aiUsage.upsert({
            where,
            create: { subjectType, subjectId, windowStart: start, count: 1 },
            update: { count: { increment: 1 } },
        });
        return row.count;
    } catch {
        const row = await prisma.aiUsage.update({ where, data: { count: { increment: 1 } } });
        return row.count;
    }
}

/**
 * Poda de ventanas vencidas. Se hace de vez en cuando y no en un cron porque no
 * hay ninguno en el proyecto: una tabla de contadores que crece sin techo es un
 * problema más seguro que un servicio nuevo que mantener.
 */
async function pruneOldWindows(now: number): Promise<void> {
    if (Math.random() >= 0.01) return;
    try {
        await prisma.aiUsage.deleteMany({ where: { windowStart: { lt: new Date(now - 2 * DAY_MS) } } });
    } catch {
        // La poda es oportunista: si falla, la próxima llamada lo reintenta.
    }
}

export type QuotaResult =
    | { allowed: true }
    | { allowed: false; scope: "user" | "institute"; retryAfterSeconds: number };

/**
 * Cuenta una llamada de IA y dice si se puede seguir. Hay que llamarla **antes**
 * de pegarle al proveedor: la idea es no gastar la request, no medirla.
 */
export async function consumeAiQuota(
    userId: string,
    instituteId: string | null
): Promise<QuotaResult> {
    const now = Date.now();

    const userWindow = windowStart(now, HOUR_MS);
    const userCount = await bump("USER", userId, userWindow);

    if (userCount > limitFromEnv("AI_LIMIT_USER_HOURLY", DEFAULT_USER_HOURLY)) {
        return {
            allowed: false,
            scope: "user",
            retryAfterSeconds: Math.ceil((userWindow.getTime() + HOUR_MS - now) / 1000),
        };
    }

    // El instituto se cuenta después de aprobar al usuario: si al alumno ya se le
    // negó la llamada, el instituto no la pagó y no corresponde imputársela.
    if (instituteId) {
        const instituteWindow = windowStart(now, DAY_MS);
        const instituteCount = await bump("INSTITUTE", instituteId, instituteWindow);

        if (instituteCount > limitFromEnv("AI_LIMIT_INSTITUTE_DAILY", DEFAULT_INSTITUTE_DAILY)) {
            return {
                allowed: false,
                scope: "institute",
                retryAfterSeconds: Math.ceil((instituteWindow.getTime() + DAY_MS - now) / 1000),
            };
        }
    }

    await pruneOldWindows(now);
    return { allowed: true };
}
