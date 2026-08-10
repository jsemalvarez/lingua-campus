import { getServerSession } from "next-auth";
import { UserRole } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { getActiveRole } from "@/lib/roles";
import prisma from "@/lib/prisma";

/**
 * Punto único de autorización.
 *
 * Antes de esto, cada server action y cada página repetía su propia versión del
 * chequeo, con criterios distintos: había dos copias textuales de
 * `getAuthAndInstitute()` en el módulo de pagos y una tercera variante inline que
 * ni siquiera excluía a SUPERADMIN. Toda variante nueva es una oportunidad de
 * olvidarse algo.
 *
 * Dos decisiones de diseño que conviene tener presentes:
 *
 * 1. **Los roles se leen de la base, no del JWT.** El token dura 30 días, así que
 *    si a alguien le cambian los roles, los del token quedan viejos (SEC-08).
 *    Cuesta una query por acción — la misma que ya hacían los helpers que
 *    reemplaza.
 *
 * 2. **Se autoriza por rol activo, no por "algún rol".** Quien tiene dos roles y
 *    está operando como profesor no puede ejecutar acciones de administración sin
 *    cambiar de modo. Es lo que hace significativo al selector de rol, y coincide
 *    con lo que ya muestra la interfaz.
 */

export type AuthContext = {
    userId: string;
    /** `null` para SUPERADMIN, que no pertenece a ningún instituto. */
    instituteId: string | null;
    roles: string[];
    activeRole: string;
    isStudent: boolean;
};

/** Contexto de personal con instituto asignado: `instituteId` garantizado. */
export type StaffContext = Omit<AuthContext, "instituteId" | "isStudent"> & {
    instituteId: string;
    isStudent: false;
};

/**
 * Identidad del usuario autenticado, con los roles verificados contra la base.
 * Devuelve `null` si no hay sesión o si la cuenta no está activa.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user;
    if (!sessionUser?.id) return null;

    const loadStudent = async (): Promise<AuthContext | null> => {
        const student = await prisma.student.findUnique({
            where: { id: sessionUser.id },
            select: { id: true, instituteId: true, status: true },
        });
        if (!student || student.status !== "ACTIVE") return null;

        return {
            userId: student.id,
            instituteId: student.instituteId,
            roles: ["STUDENT"],
            activeRole: "STUDENT",
            isStudent: true,
        };
    };

    // Los alumnos viven en otra tabla y su rol nunca cambia, así que el token
    // alcanza para saber dónde buscarlos.
    if ((sessionUser.roles ?? []).includes("STUDENT")) {
        return loadStudent();
    }

    const user = await prisma.user.findUnique({
        where: { id: sessionUser.id },
        select: { id: true, instituteId: true, status: true, roles: true },
    });

    // Un token emitido antes de que existiera `roles` no dice de qué tabla es.
    // Si no aparece en `User`, puede ser un alumno con la sesión vieja.
    if (!user) return loadStudent();

    if (user.status !== "ACTIVE") return null;

    // `roles` es la única fuente de verdad. No se cae de vuelta al campo `role`
    // deprecado a propósito: al dar de baja a un profesor se vacía `roles` pero
    // `role` queda intacto, así que ese fallback le devolvería los permisos.
    // Ver SEC-01 en docs/BACKLOG-TECNICO.md.
    const roles: string[] = user.roles;
    if (roles.length === 0) return null;

    return {
        userId: user.id,
        instituteId: user.instituteId,
        roles,
        activeRole: await getActiveRole(roles),
        isStudent: false,
    };
}

/**
 * Exige que el rol activo esté entre los permitidos y que el usuario tenga
 * instituto asignado. Devuelve `null` si no corresponde, para que quien llame
 * responda con su propio mensaje de error:
 *
 * ```ts
 * const auth = await requireRole(["ADMIN", "SECRETARY"]);
 * if (!auth) return { success: false, error: "No autorizado" };
 * ```
 *
 * SUPERADMIN no pasa por acá: no tiene `instituteId` y opera sobre el panel de
 * institutos, que tiene su propio control.
 */
export async function requireRole(
    allowed: readonly UserRole[]
): Promise<StaffContext | null> {
    const ctx = await getAuthContext();
    if (!ctx || ctx.isStudent || !ctx.instituteId) return null;
    if (!allowed.includes(ctx.activeRole as UserRole)) return null;

    return {
        userId: ctx.userId,
        instituteId: ctx.instituteId,
        roles: ctx.roles,
        activeRole: ctx.activeRole,
        isStudent: false,
    };
}
