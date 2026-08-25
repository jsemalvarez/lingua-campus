import prisma from "@/lib/prisma";

/**
 * Métrica 6 · cuentas que conservan la contraseña que les dio el sistema
 * (FEAT-11, SEC-06).
 *
 * **El título dice lo que mide.** No contesta "quién nunca entró": nada obliga a
 * cambiar la contraseña, así que alguien que entra todos los días puede seguir
 * con la que le dieron. Esa confusión estuvo en la ficha hasta el 2026-08-24.
 *
 * **Tres estados y no dos.** `null` en la columna no es "no tiene la contraseña
 * por defecto", es **"todavía no se revisó"**, y la pantalla los distingue: con
 * cuentas sin revisar el mosaico no muestra un número, muestra el botón de la
 * pasada. Mostrar un total parcial como si fuera el total es exactamente lo que
 * la ficha decidió no hacer más.
 */

export type Grupo = "alumno" | "tutor" | "profesor" | "administracion";

export const NOMBRE_DEL_GRUPO: Record<Grupo, string> = {
    alumno: "Alumnos",
    tutor: "Tutores",
    profesor: "Profesores",
    administracion: "Administración",
};

export interface CuentaConDefecto {
    id: string;
    nombre: string;
    grupo: Grupo;
    /** Email, o el DNI cuando el alumno no tiene correo (que es lo habitual). */
    identificador: string;
    telefono: string | null;
    /**
     * La ficha a la que lleva la fila, o `null` si no hay ninguna.
     *
     * **Se resuelve por rol y no por grupo**, y no es lo mismo: `/teachers/[id]`
     * exige rol `TEACHER` y `/guardians/[id]` exige `GUARDIAN`, así que una
     * persona agrupada en administración pero que además da clases sí tiene
     * ficha. Y quien es sólo `ADMIN` o `SECRETARY` no tiene ninguna pantalla
     * propia: ahí la fila no enlaza, en vez de mandar a un 404.
     */
    ficha: string | null;
}

export interface Contrasenas {
    /** Cuentas todavía sin revisar. Mientras haya una, no hay número que mostrar. */
    sinRevisar: number;
    total: number;
    porGrupo: Record<Grupo, number>;
    cuentas: CuentaConDefecto[];
}

/**
 * A qué grupo pertenece una persona que tiene varios roles.
 *
 * **Elige uno solo, porque es un conteo de personas**: contarla dos veces haría
 * que la suma de los grupos no dé el total. El orden va de más acceso a menos
 * —administración, profesor, tutor—, que es también el orden en que urge que
 * cambien la contraseña. Es la misma precedencia con la que el gráfico diario
 * resuelve el multi-rol, abierta en tres porque acá el instituto quiere el corte
 * por grupo.
 */
function grupoDe(roles: string[]): Grupo {
    if (roles.includes("ADMIN") || roles.includes("SECRETARY")) return "administracion";
    if (roles.includes("TEACHER")) return "profesor";
    return "tutor";
}

/** Ver la nota en `CuentaConDefecto.ficha`. */
function fichaDe(id: string, roles: string[]): string | null {
    if (roles.includes("TEACHER")) return `/teachers/${id}`;
    if (roles.includes("GUARDIAN")) return `/guardians/${id}`;
    return null;
}

export async function cargarContrasenas(instituteId: string): Promise<Contrasenas> {
    const [sinRevisarAlumnos, sinRevisarUsuarios, alumnos, usuarios] = await Promise.all([
        // El pendiente se cuenta sobre todas las cuentas y no sólo las activas,
        // porque eso es lo que recorre la pasada: si contara distinto, la
        // pantalla diría "listo" con trabajo a medio hacer.
        prisma.student.count({ where: { instituteId, hasDefaultPassword: null } }),
        prisma.user.count({ where: { instituteId, hasDefaultPassword: null } }),

        prisma.student.findMany({
            where: { instituteId, status: "ACTIVE", hasDefaultPassword: true },
            select: { id: true, name: true, email: true, dni: true, phone: true },
            orderBy: { name: "asc" },
        }),
        prisma.user.findMany({
            where: { instituteId, status: "ACTIVE", hasDefaultPassword: true },
            select: { id: true, name: true, email: true, phone: true, roles: true },
            orderBy: { name: "asc" },
        }),
    ]);

    const cuentas: CuentaConDefecto[] = [
        ...alumnos.map((a) => ({
            id: a.id,
            nombre: a.name,
            grupo: "alumno" as Grupo,
            identificador: a.email || a.dni || "—",
            telefono: a.phone,
            ficha: `/students/${a.id}`,
        })),
        ...usuarios.map((u) => ({
            id: u.id,
            nombre: u.name,
            grupo: grupoDe(u.roles),
            identificador: u.email,
            telefono: u.phone,
            ficha: fichaDe(u.id, u.roles),
        })),
    ];

    const porGrupo: Record<Grupo, number> = {
        alumno: 0,
        tutor: 0,
        profesor: 0,
        administracion: 0,
    };
    for (const c of cuentas) porGrupo[c.grupo]++;

    return {
        sinRevisar: sinRevisarAlumnos + sinRevisarUsuarios,
        total: cuentas.length,
        porGrupo,
        cuentas,
    };
}
