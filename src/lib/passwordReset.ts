import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { isDefaultForUser } from "@/lib/defaultPasswords";

/**
 * Los tokens de recuperación de contraseña (FEAT-05).
 *
 * **Hoy sólo se emiten para cuentas de `User`** —tutores, profesores y
 * administración—, que es la primera de las dos entregas. Los alumnos van
 * después: el modelo ya distingue el sujeto por `subjectType`, así que entrar
 * con ellos es agregar una rama acá y en la resolución del identificador, sin
 * migración ni cambios de pantalla.
 */

/** Vida del enlace. Corta a propósito: viaja por correo y queda en la bandeja. */
export const RESET_TOKEN_TTL_MINUTES = 60;

/** Mismo mínimo que pide el cambio de contraseña desde el perfil. */
export const MIN_PASSWORD_LENGTH = 6;

const RATE_WINDOW_MINUTES = 15;
const MAX_REQUESTS_PER_WINDOW = 3;

export type ResetSubjectType = "USER" | "STUDENT";

export type ResetSubject = {
    type: ResetSubjectType;
    id: string;
    instituteId: string | null;
};

/**
 * SHA-256 y no bcrypt, al revés que las contraseñas.
 *
 * El token son 32 bytes al azar: no hay diccionario que lo adivine, así que el
 * costo deliberado de bcrypt no protegería de nada. Y hace falta que el hash sea
 * determinístico para poder buscar la fila por índice único — con bcrypt, que
 * usa una salt distinta cada vez, habría que recorrer la tabla comparando de a
 * una.
 */
function hashToken(token: string): string {
    return createHash("sha256").update(token).digest("hex");
}

/**
 * Deja sin efecto todo token pendiente del sujeto.
 *
 * Hay que llamarla desde **cualquier** lugar que escriba una contraseña: si no,
 * un enlace viejo sigue sirviendo después de que la persona ya cambió la suya, o
 * después de que el instituto se la restableció a mano.
 */
export async function invalidateResetTokens(
    subjectType: ResetSubjectType,
    subjectId: string
): Promise<void> {
    await prisma.passwordResetToken.updateMany({
        where: { subjectType, subjectId, consumedAt: null },
        data: { consumedAt: new Date() },
    });
}

/**
 * Emite un token y devuelve el original — lo único que se manda por correo y lo
 * único que no queda guardado. `null` si el sujeto ya pidió demasiados.
 *
 * **El límite se cuenta sobre esta misma tabla**, no sobre un contador aparte.
 * Cada pedido deja una fila con su fecha, así que "cuántos pidió en los últimos
 * quince minutos" es una consulta y no una tabla nueva que mantener.
 *
 * Se limita por cuenta y no por IP a propósito. Lo que hay que evitar es que el
 * formulario sirva para inundarle la bandeja a una persona, y eso se corta acá.
 * Contar por IP obligaría a guardar la IP de cualquiera que pase por la
 * pantalla, que es un dato personal que hoy el sistema no guarda en ningún lado;
 * y de las direcciones que no existen no sale ningún correo ni queda ninguna
 * fila, así que tampoco hay nada que inundar.
 */
export async function issueResetToken(subject: ResetSubject): Promise<string | null> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - RATE_WINDOW_MINUTES * 60_000);

    const recientes = await prisma.passwordResetToken.count({
        where: {
            subjectType: subject.type,
            subjectId: subject.id,
            createdAt: { gte: windowStart },
        },
    });

    if (recientes >= MAX_REQUESTS_PER_WINDOW) return null;

    // El pedido más nuevo es el único que vale: si alguien pide dos veces porque
    // el primer correo tardó, que los dos enlaces sirvan es una ventana abierta
    // de más, no una comodidad.
    await invalidateResetTokens(subject.type, subject.id);

    const token = randomBytes(32).toString("hex");

    await prisma.passwordResetToken.create({
        data: {
            tokenHash: hashToken(token),
            subjectType: subject.type,
            subjectId: subject.id,
            instituteId: subject.instituteId,
            expiresAt: new Date(now.getTime() + RESET_TOKEN_TTL_MINUTES * 60_000),
        },
    });

    return token;
}

export type ResetSubjectLookup =
    | { valid: true; subjectType: ResetSubjectType; subjectId: string; name: string }
    | { valid: false; reason: "invalid" | "expired" | "used" };

/**
 * De quién es la contraseña que este enlace cambia, si el enlace sirve.
 *
 * Devuelve el nombre porque la pantalla tiene que decirlo. Con los alumnos el
 * correo le llega al tutor, que puede tener más de un hijo en el instituto: sin
 * el nombre a la vista, cambia la contraseña del hermano equivocado.
 */
export async function findResetSubject(token: string): Promise<ResetSubjectLookup> {
    const row = await prisma.passwordResetToken.findUnique({
        where: { tokenHash: hashToken(token) },
    });

    if (!row) return { valid: false, reason: "invalid" };
    if (row.consumedAt) return { valid: false, reason: "used" };
    if (row.expiresAt < new Date()) return { valid: false, reason: "expired" };

    if (row.subjectType === "USER") {
        const user = await prisma.user.findUnique({
            where: { id: row.subjectId },
            select: { id: true, name: true, status: true },
        });

        // Una cuenta dada de baja entre el pedido y el clic no vuelve por acá.
        if (!user || user.status !== "ACTIVE") return { valid: false, reason: "invalid" };

        return { valid: true, subjectType: "USER", subjectId: user.id, name: user.name };
    }

    // Acá va la rama de `Student` cuando entre la segunda entrega. Hoy no se
    // emite ningún token con ese sujeto, así que llegar hasta acá significa una
    // fila escrita a mano.
    return { valid: false, reason: "invalid" };
}

/**
 * Gasta el token y escribe la contraseña nueva.
 *
 * **El token se marca antes de tocar la contraseña**, con un `updateMany` que
 * exige que siguiera sin usar. Ese `count === 0` es la única defensa contra dos
 * clics simultáneos sobre el mismo enlace: comprobar y después escribir deja una
 * ventana en la que los dos pasan. Si algo falla después, el token ya se quemó y
 * hay que pedir otro — que es el lado correcto para fallar.
 */
export async function consumeResetToken(
    token: string,
    newPassword: string
): Promise<{ success: true } | { success: false; error: string }> {
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
        return { success: false, error: `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.` };
    }

    const row = await prisma.passwordResetToken.findUnique({
        where: { tokenHash: hashToken(token) },
    });

    if (!row) return { success: false, error: "El enlace no es válido." };
    if (row.consumedAt) return { success: false, error: "Este enlace ya fue utilizado." };
    if (row.expiresAt < new Date()) return { success: false, error: "El enlace expiró." };

    const gastado = await prisma.passwordResetToken.updateMany({
        where: { id: row.id, consumedAt: null },
        data: { consumedAt: new Date() },
    });

    if (gastado.count === 0) return { success: false, error: "Este enlace ya fue utilizado." };

    if (row.subjectType !== "USER") {
        return { success: false, error: "El enlace no es válido." };
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    // La marca se recalcula en vez de darla por apagada: casi siempre la nueva
    // contraseña saca a la cuenta del conteo, pero no si eligió justo una de las
    // que reparte el sistema. Es el mismo criterio del cambio desde el perfil.
    await prisma.user.update({
        where: { id: row.subjectId },
        data: {
            password: hashed,
            hasDefaultPassword: isDefaultForUser(newPassword),
        },
    });

    // Los demás enlaces pendientes de esta cuenta dejan de servir.
    await invalidateResetTokens("USER", row.subjectId);

    return { success: true };
}
