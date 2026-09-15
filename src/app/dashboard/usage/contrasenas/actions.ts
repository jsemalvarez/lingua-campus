"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";
import prisma from "@/lib/prisma";
import { studentDefaults, userDefaults } from "@/lib/defaultPasswords";

/**
 * La pasada que llena el pasado de la métrica 6 (FEAT-11).
 *
 * **Por qué existe y por qué corre una sola vez.** Los hashes llevan salt
 * aleatoria, así que la respuesta no sale de una consulta: hay que probar cada
 * candidato con `bcrypt.compare`. De ahí en adelante no hace falta volver a
 * comparar nunca — las escrituras de contraseña sostienen la marca porque saben
 * qué están escribiendo.
 *
 * **Por qué por lotes, y no de una.** Un `bcrypt.compare` con coste 10 son
 * decenas de milisegundos, y son ~310 cuentas con hasta cuatro candidatos cada
 * una: la pasada entera pasa el minuto y se la come el límite de la función
 * serverless. En lotes, cada llamada entra cómoda y la pantalla puede mostrar
 * cuánto falta. Y es **reanudable**: si una llamada se corta, las cuentas ya
 * resueltas quedan resueltas y la siguiente sigue donde estaba.
 */

/**
 * Cuántas cuentas revisa cada llamada, **contando alumnos y usuarios juntos**.
 *
 * El número sale de medir y no de estimar: un `bcrypt.compare` con coste 10
 * tarda ~137 ms (medido el 2026-08-24 en desarrollo), y el peor caso son cuatro
 * por cuenta. Doce cuentas son ~6,6 segundos, que entra con margen aun en el
 * presupuesto más corto de una función serverless. Y el presupuesto es lo que
 * manda: pasarse no da un lote lento, da un lote perdido.
 */
const LOTE = 12;

/**
 * Si el hash guardado corresponde a alguno de los candidatos. Corta en la
 * primera coincidencia, que es el caso frecuente: la mayoría de las cuentas con
 * contraseña por defecto tienen la de su alta, y esa va primera en la lista.
 */
async function esAlgunoDeLosDefectos(
    hash: string | null,
    candidatos: string[]
): Promise<boolean> {
    if (!hash) return false;

    for (const candidato of candidatos) {
        try {
            if (await bcrypt.compare(candidato, hash)) return true;
        } catch {
            // Un hash con otro formato o una salt inválida no puede tumbar la
            // pasada entera por una fila. Queda en "no" y sigue.
            return false;
        }
    }
    return false;
}

export interface ResultadoDeLaPasada {
    ok: boolean;
    /** Cuántas se resolvieron en esta llamada. */
    revisadas: number;
    /** Cuántas quedan sin revisar. Cero = terminó. */
    faltan: number;
    error?: string;
}

export async function revisarContrasenasPorDefecto(): Promise<ResultadoDeLaPasada> {
    const auth = await requireRole(["ADMIN"]);
    if (!auth) return { ok: false, revisadas: 0, faltan: 0, error: "Sin permisos" };

    const { instituteId } = auth;

    try {
        // **Sin filtrar por estado, a propósito.** El mosaico muestra sólo las
        // cuentas activas, pero la pasada resuelve todas: si dejara afuera a un
        // preinscripto, el día que pase a alumno entraría al conteo en `null` y
        // el número quedaría incompleto sin que nadie se entere.
        //
        // Los dos conjuntos se piden en serie y no en paralelo porque **comparten
        // el lote**: en paralelo, cada uno traería `LOTE` y el trabajo real sería
        // el doble del presupuestado, que es justo lo que el lote existe para
        // evitar. Los usuarios entran con lo que sobra, y cuando los alumnos se
        // terminan se llevan el lote entero.
        const alumnos = await prisma.student.findMany({
            where: { instituteId, hasDefaultPassword: null },
            select: { id: true, password: true, dni: true },
            take: LOTE,
        });

        const resto = LOTE - alumnos.length;
        const usuarios = resto > 0
            ? await prisma.user.findMany({
                where: { instituteId, hasDefaultPassword: null },
                select: { id: true, password: true },
                take: resto,
            })
            : [];

        if (alumnos.length === 0 && usuarios.length === 0) {
            return { ok: true, revisadas: 0, faltan: 0 };
        }

        const alumnosConDefecto: string[] = [];
        const alumnosSinDefecto: string[] = [];
        for (const a of alumnos) {
            const tiene = await esAlgunoDeLosDefectos(a.password, studentDefaults(a.dni));
            (tiene ? alumnosConDefecto : alumnosSinDefecto).push(a.id);
        }

        const usuariosConDefecto: string[] = [];
        const usuariosSinDefecto: string[] = [];
        for (const u of usuarios) {
            const tiene = await esAlgunoDeLosDefectos(u.password, userDefaults());
            (tiene ? usuariosConDefecto : usuariosSinDefecto).push(u.id);
        }

        // Cuatro sentencias y no una por cuenta: el pool son 5 conexiones
        // (ARQ-02) y esto corre mientras el instituto usa el sistema.
        await Promise.all([
            marcarAlumnos(alumnosConDefecto, true),
            marcarAlumnos(alumnosSinDefecto, false),
            marcarUsuarios(usuariosConDefecto, true),
            marcarUsuarios(usuariosSinDefecto, false),
        ]);

        const faltan = await contarSinRevisar(instituteId);
        if (faltan === 0) revalidatePath("/dashboard/usage");

        return { ok: true, revisadas: alumnos.length + usuarios.length, faltan };
    } catch (e) {
        console.error("Error revisando contraseñas por defecto:", e);
        return { ok: false, revisadas: 0, faltan: 0, error: "Error al revisar las cuentas" };
    }
}

function marcarAlumnos(ids: string[], valor: boolean) {
    if (ids.length === 0) return Promise.resolve(null);
    return prisma.student.updateMany({
        where: { id: { in: ids } },
        data: { hasDefaultPassword: valor },
    });
}

function marcarUsuarios(ids: string[], valor: boolean) {
    if (ids.length === 0) return Promise.resolve(null);
    return prisma.user.updateMany({
        where: { id: { in: ids } },
        data: { hasDefaultPassword: valor },
    });
}

async function contarSinRevisar(instituteId: string): Promise<number> {
    const [a, u] = await Promise.all([
        prisma.student.count({ where: { instituteId, hasDefaultPassword: null } }),
        prisma.user.count({ where: { instituteId, hasDefaultPassword: null } }),
    ]);
    return a + u;
}
