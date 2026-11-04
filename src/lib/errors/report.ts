import { createHash } from "crypto";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getAuthContext, type AuthContext } from "@/lib/authz";
import { areaOf } from "./areas";
import { alertIfFirstSeenInScope } from "./alert";
import { UserError } from "./userError";

/**
 * Punto único de registro de errores (ARQ-09).
 *
 * Reemplaza a los `console.error` sueltos: el error se sigue imprimiendo en el
 * log de Vercel, pero además queda guardado, agrupado por problema y con el
 * contexto de quién y dónde. Es el mismo patrón de `getAuthContext` y
 * `guardPracticeAi`: un solo lugar donde cambiar de destino el día que haga
 * falta.
 *
 * ```ts
 * } catch (error) {
 *     await reportError(error, { action: "asistencia.guardar", context: { lessonId } });
 *     return { success: false, error: "No se pudo guardar la asistencia." };
 * }
 * ```
 *
 * **Nunca tira.** Si guardar el error falla —la base caída es justo cuando más
 * errores hay— se imprime y sigue: el registro no puede ser lo que rompa la
 * acción que lo llamó.
 */

/** Sólo ids y valores sueltos. Nada de nombres, DNI ni texto que haya escrito alguien. */
export type ErrorContext = Record<string, string | number | boolean | null | undefined>;

export type ReportOptions = {
    /** Qué se estaba haciendo, en forma `area.verbo`: "asistencia.guardar". Es parte de la huella. */
    action: string;
    /**
     * Si terminó en un cartel en pantalla. Por defecto sí, porque es lo que hace
     * casi todo `catch` que devuelve `{ success: false }`. Lo que falla por detrás
     * sin que nadie lo note —el logo del recibo— lo pone en falso.
     */
    shownToUser?: boolean;
    context?: ErrorContext;
    path?: string;
    /** Si quien llama ya lo tiene, se ahorra una query. `null` = no hay sesión que buscar. */
    auth?: AuthContext | null;
    /**
     * El instituto, cuando no sale de la sesión: el formulario de inscripción es
     * público y sabe a qué instituto se anotan aunque nadie esté logueado. Sin
     * esto, sus fallas caerían en "PLATAFORMA" y el aviso no diría de quién son.
     */
    instituteId?: string | null;
};

export type ReportResult = {
    issueId: string;
    /** Primera vez que este problema aparece en este instituto: lo que dispara el aviso. */
    isNewInScope: boolean;
};

const NO_INSTITUTE_SCOPE = "PLATAFORMA";
const MAX_MESSAGE_CHARS = 300;

export async function reportError(error: unknown, options: ReportOptions): Promise<ReportResult | null> {
    const { action, shownToUser = true, context, path } = options;

    // El log de Vercel sigue teniendo el error completo, como hasta ahora.
    console.error(`[${action}]`, context ?? {}, error);

    try {
        const { kind, message } = describeError(error);
        const fingerprint = fingerprintOf(action, kind, message);
        const area = areaOf(action);

        const auth = options.auth !== undefined ? options.auth : await safeAuthContext();
        const instituteId = options.instituteId ?? auth?.instituteId ?? null;
        const scope = instituteId ?? NO_INSTITUTE_SCOPE;
        const now = new Date();

        const result = await prisma.$transaction(async (tx) => {
            const issue = await tx.errorIssue.upsert({
                where: { fingerprint },
                create: { fingerprint, action, area, kind, message, count: 1, firstSeenAt: now, lastSeenAt: now },
                // El área se reescribe en cada falla: si se corrige el mapa, los
                // problemas que siguen pasando se reubican solos.
                update: { area, count: { increment: 1 }, lastSeenAt: now },
                select: { id: true, status: true },
            });

            // Estaba marcado como resuelto y volvió a pasar: el arreglo no alcanzó.
            // Se reabre y se vacían los avisos, para que vuelva a llegar el mail.
            const reopened = issue.status === "RESOLVED";
            if (reopened) {
                await tx.errorIssue.update({
                    where: { id: issue.id },
                    data: { status: "OPEN", resolvedAt: null },
                });
                await tx.errorIssueScope.updateMany({
                    where: { issueId: issue.id },
                    data: { notifiedAt: null },
                });
            }

            // `skipDuplicates` es lo que contesta «¿primera vez acá?» sin carrera:
            // si dos fallas llegan juntas, una sola inserta.
            const inserted = await tx.errorIssueScope.createMany({
                data: [{ issueId: issue.id, scope, count: 1, firstSeenAt: now, lastSeenAt: now }],
                skipDuplicates: true,
            });
            const isNewInScope = inserted.count === 1;

            if (!isNewInScope) {
                await tx.errorIssueScope.update({
                    where: { issueId_scope: { issueId: issue.id, scope } },
                    data: { count: { increment: 1 }, lastSeenAt: now },
                });
            }

            await tx.errorEvent.create({
                data: {
                    issueId: issue.id,
                    instituteId,
                    subjectType: auth ? (auth.isStudent ? "STUDENT" : "USER") : null,
                    subjectId: auth?.userId ?? null,
                    role: auth?.activeRole ?? null,
                    shownToUser,
                    path: path ?? null,
                    context: context ? cleanContext(context) : undefined,
                },
            });

            return { issueId: issue.id, isNewInScope, reopened };
        });

        // Fuera de la transacción: un mail no puede tenerla abierta, y si no sale
        // el error igual queda guardado. `alertIfFirstSeenInScope` no tira.
        if (shownToUser) {
            await alertIfFirstSeenInScope({
                issueId: result.issueId,
                scope,
                role: auth?.activeRole ?? null,
                context,
                at: now,
                reopened: result.reopened,
            });
        }

        return { issueId: result.issueId, isNewInScope: result.isNewInScope };
    } catch (reportFailure) {
        console.error("[reportError] No se pudo registrar el error:", reportFailure);
        return null;
    }
}

/**
 * Lo que va a la pantalla cuando algo sale por el `catch` (ARQ-09).
 *
 * Un `UserError` es un mensaje escrito para el usuario: se devuelve tal cual y
 * **no se registra**, porque no es una falla. Cualquier otra cosa —Prisma, un
 * proveedor, un `TypeError`— se registra y se cambia por `fallback`, que es un
 * mensaje en castellano. Así el error crudo nunca llega a la pantalla.
 *
 * ```ts
 * } catch (e) {
 *     return { success: false, error: await userMessageFor(e, "No se pudo anular el pago.", { action: "cobros.anular" }) };
 * }
 * ```
 */
export async function userMessageFor(error: unknown, fallback: string, options: ReportOptions): Promise<string> {
    if (error instanceof UserError) return error.message;
    await reportError(error, options);
    return fallback;
}

/**
 * Los campos de la restricción única que saltó (el `P2002` de Prisma), o `null`
 * si no fue eso. Un dato repetido no es una falla: es algo que el usuario puede
 * arreglar, y hay que decirle cuál es en vez de registrarlo.
 *
 * `meta.target` llega como lista de campos o, según la versión, como el nombre de
 * la restricción (`Student_dni_instituteId_key`): las dos sirven para buscar el
 * campo con `includes`.
 */
export function uniqueViolationFields(error: unknown): string[] | null {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") return null;
    const target = error.meta?.target;
    if (Array.isArray(target)) return target.map(String);
    if (typeof target === "string") return target.split("_");
    return [];
}

/** Fuera de un request —o con la base caída— no hay sesión que leer, y no es motivo para perder el error. */
async function safeAuthContext(): Promise<AuthContext | null> {
    try {
        return await getAuthContext();
    } catch {
        return null;
    }
}

/**
 * Tipo y mensaje que se guardan. Lo delicado son los errores de Prisma: el de
 * validación copia en el mensaje los argumentos de la query, y ahí van nombres,
 * DNI y lo que se estaba guardando. De ese se queda sólo con qué llamada era.
 */
export function describeError(error: unknown): { kind: string; message: string } {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        return { kind: error.code, message: clean(lastLine(error.message)) };
    }
    if (error instanceof Prisma.PrismaClientValidationError) {
        const call = error.message.match(/prisma\.\w+\.\w+\(\)/)?.[0];
        return { kind: "PrismaValidation", message: call ? `Argumentos inválidos en ${call}` : "Argumentos inválidos" };
    }
    if (error instanceof Prisma.PrismaClientInitializationError) {
        return { kind: error.errorCode ?? "PrismaInit", message: clean(firstLine(error.message)) };
    }
    if (error instanceof Error) {
        return { kind: error.name || "Error", message: clean(summarize(error.message)) };
    }
    return { kind: "Unknown", message: clean(firstLine(String(error))) };
}

function firstLine(text: string): string {
    return text.split("\n").map((l) => l.trim()).find((l) => l.length > 0) ?? "";
}

/**
 * La primera línea, salvo cuando abre un JSON: los proveedores devuelven
 * `Gemini API 400: {` y el motivo viene adentro, en `"message"`. Quedarse con la
 * primera línea guardaba sólo `Gemini API 400: {`, que no dice nada.
 */
function summarize(text: string): string {
    const first = firstLine(text);
    if (!/[{[]$/.test(first)) return first;

    const inner = text.match(/"message"\s*:\s*"((?:[^"\\]|\\.)*)"/)?.[1];
    const head = first.replace(/[{[]$/, "").trim();
    return inner ? `${head} ${inner}` : head;
}

function lastLine(text: string): string {
    const lines = text.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);
    return lines[lines.length - 1] ?? "";
}

/**
 * Saca lo que no tiene que quedar guardado: claves que algunos proveedores
 * meten en la URL (la de Gemini viaja como `?key=`, PED-05), tokens, correos y
 * números largos que pueden ser un DNI o un teléfono.
 */
function clean(text: string): string {
    return text
        .replace(/([?&](?:key|api_key|token|access_token)=)[^&\s"']+/gi, "$1[oculto]")
        .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/g, "Bearer [oculto]")
        .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[correo]")
        .replace(/\b\d{7,}\b/g, "[número]")
        .slice(0, MAX_MESSAGE_CHARS);
}

/**
 * La huella ignora lo que cambia de una falla a otra del mismo problema —ids,
 * números, fechas—, para que «Lesson c1a2… not found» y «Lesson c9z8… not found»
 * sean el mismo problema y no dos.
 */
function fingerprintOf(action: string, kind: string, message: string): string {
    const normalized = message
        .replace(/\bc[a-z0-9]{20,}\b/g, ":id")
        .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, ":uuid")
        .replace(/\d+/g, "#");
    return createHash("sha256").update(`${action}|${kind}|${normalized}`).digest("hex").slice(0, 32);
}

function cleanContext(context: ErrorContext): Prisma.InputJsonObject {
    const out: Record<string, string | number | boolean | null> = {};
    for (const [key, value] of Object.entries(context)) {
        if (value === undefined) continue;
        out[key] = typeof value === "string" ? value.slice(0, 200) : value;
    }
    return out;
}
