/**
 * Las contraseñas que reparte el sistema, y cómo saber si una cuenta todavía
 * tiene la suya (FEAT-11 métrica 6, SEC-06, SEC-11).
 *
 * **Este archivo no importa nada**, y conviene que siga así: el catálogo lo
 * necesitan también dos pantallas que le muestran la contraseña inicial a quien
 * da de alta la cuenta, y son componentes de cliente. Con un `import bcrypt`
 * acá, esa librería se iría al bundle del navegador. La comparación de hashes
 * —lo único que necesita bcrypt— vive en la pasada, que corre en el servidor.
 *
 * **Qué mide y qué no.** Esto contesta "¿cuántas cuentas conservan la
 * contraseña que les dimos?", que es una pregunta de seguridad. **No** contesta
 * "¿quién nunca entró?": nada obliga a cambiar la contraseña —no hay
 * `mustChangePassword`, ni vencimiento, ni aviso—, así que alguien que entra
 * todos los días puede seguir con la que le dieron. Esa confusión estuvo escrita
 * en FEAT-11 hasta el 2026-08-24 y está corregida en la ficha.
 *
 * **Por qué la marca se guarda y no se calcula.** Los hashes llevan salt
 * aleatoria, así que no hay consulta SQL que los compare: hay que correr
 * `bcrypt.compare` fila por fila, y con ~300 cuentas y varios candidatos cada
 * una son decenas de segundos. Imposible al cargar una pantalla.
 *
 * **Pero comparar hace falta una sola vez.** De ahí en adelante, cada lugar que
 * escribe una contraseña **ya sabe cuál está escribiendo**, así que enciende o
 * apaga la marca sin comparar nada. La pasada llena el pasado; las escrituras
 * sostienen el presente.
 */

/**
 * Las siete fijas, con el archivo que las escribe. Es la misma lista de SEC-06:
 * si aparece una nueva, va acá y no suelta en una acción.
 */
export const DEFAULT_PASSWORDS = {
    /** Alta de alumno — `students/new/actions.ts` */
    STUDENT_NEW: "estudiante123",
    /** Reset de alumno **sin DNI** — `students/[id]/actions.ts` */
    STUDENT_RESET_FALLBACK: "lingua1234",
    /** Pre-inscripción pública — `inscription/actions.ts` */
    INSCRIPTION: "inscripcion123",
    /** Alta de tutor — `students/[id]/actions.ts` */
    GUARDIAN_NEW: "Modern2026",
    /** Reset de tutor — `guardians/[id]/actions.ts` */
    GUARDIAN_RESET: "tutor1234",
    /** Reset de profesor — `teachers/actions.ts` */
    TEACHER_RESET: "docente1234",
    /** Alta de admin de instituto — `admin/actions.ts` y el repositorio del superadmin */
    ADMIN_NEW: "admin123",
} as const;

/**
 * Las que puede llegar a tener un `User`.
 *
 * **Se prueban todas contra toda cuenta, sin mirar el rol.** Desde SEC-01 una
 * persona puede ser tutora y profesora a la vez, y los resets no preguntan qué
 * rol tenía cuando se los hicieron: filtrar por rol dejaría afuera justamente
 * las combinaciones raras, que son las que nadie revisa.
 */
const USER_DEFAULTS: string[] = [
    DEFAULT_PASSWORDS.GUARDIAN_NEW,
    DEFAULT_PASSWORDS.GUARDIAN_RESET,
    DEFAULT_PASSWORDS.TEACHER_RESET,
    DEFAULT_PASSWORDS.ADMIN_NEW,
];

/**
 * Las de un alumno. El **DNI es la contraseña** del reset
 * ([`students/[id]/actions.ts`](../app/students/[id]/actions.ts)), así que es
 * distinta para cada uno y entra por parámetro.
 */
export function studentDefaults(dni: string | null | undefined): string[] {
    const fijas = [
        DEFAULT_PASSWORDS.STUDENT_NEW,
        DEFAULT_PASSWORDS.STUDENT_RESET_FALLBACK,
        DEFAULT_PASSWORDS.INSCRIPTION,
    ];
    return dni ? [...fijas, dni] : fijas;
}

/** Si la contraseña que se está por escribir en un `User` es una de las nuestras. */
export function isDefaultForUser(plain: string): boolean {
    return USER_DEFAULTS.includes(plain);
}

/** Lo mismo para un alumno, contando su DNI. */
export function isDefaultForStudent(plain: string, dni: string | null | undefined): boolean {
    return studentDefaults(dni).includes(plain);
}

/** Los candidatos de un `User`, para la pasada. */
export function userDefaults(): string[] {
    return USER_DEFAULTS;
}
