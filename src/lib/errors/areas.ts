/**
 * Área de cada error (ARQ-09): para que en el panel se lea a qué parte del
 * instituto le pegó, sin abrir el detalle.
 *
 * **El área es la del trámite, no la de la pieza que falló.** Si en la
 * inscripción no sale el correo de acuse, es Administrativo y no Comunicación:
 * lo que se vio afectado fue una inscripción.
 *
 * **Se deduce acá y en ningún otro lado.** Nadie la elige en su `catch`: sale del
 * prefijo de la acción (`inscripcion.crear`) o, cuando es una página que se cayó
 * sin `catch`, de la ruta (`render /payments`). Así dos errores del mismo módulo
 * no pueden terminar en áreas distintas.
 */

export const ERROR_AREAS = {
    PEDAGOGICO: "Pedagógico",
    PRACTICA_IA: "Práctica con IA",
    RECURSOS_DOCENTE: "Recursos del docente",
    ADMINISTRATIVO: "Administrativo",
    COMUNICACION: "Comunicación",
    ACCESO: "Acceso",
    PLATAFORMA: "Plataforma",
} as const;

export type ErrorArea = keyof typeof ERROR_AREAS;

/** Prefijo de la acción —lo que va antes del primer punto— → área. */
const BY_ACTION: Record<string, ErrorArea> = {
    asistencia: "PEDAGOGICO",
    clase: "PEDAGOGICO",
    notas: "PEDAGOGICO",
    informes: "PEDAGOGICO",
    examen: "PEDAGOGICO",
    calendario: "PEDAGOGICO",

    practica: "PRACTICA_IA",

    recursos: "RECURSOS_DOCENTE",

    inscripcion: "ADMINISTRATIVO",
    alumnos: "ADMINISTRATIVO",
    tutores: "ADMINISTRATIVO",
    cursos: "ADMINISTRATIVO",
    matriculas: "ADMINISTRATIVO",
    cobros: "ADMINISTRATIVO",
    cuotas: "ADMINISTRATIVO",
    caja: "ADMINISTRATIVO",
    sueldos: "ADMINISTRATIVO",
    docentes: "ADMINISTRATIVO",
    recibos: "ADMINISTRATIVO",
    instituto: "ADMINISTRATIVO",

    mensajes: "COMUNICACION",
    avisos: "COMUNICACION",

    acceso: "ACCESO",
    contrasena: "ACCESO",
    perfil: "ACCESO",
};

/**
 * Ruta → área, para lo que llega por `instrumentation.ts`. Gana el prefijo más
 * largo: `/guardian/payments` es Administrativo aunque `/guardian` sea
 * Pedagógico (el portal de la familia es, sobre todo, notas y asistencias).
 */
const BY_ROUTE: [prefix: string, area: ErrorArea][] = [
    ["/api/practice", "PRACTICA_IA"],
    ["/practice", "PRACTICA_IA"],

    ["/resources", "RECURSOS_DOCENTE"],

    ["/courses", "PEDAGOGICO"],
    ["/academics", "PEDAGOGICO"],
    ["/schedule", "PEDAGOGICO"],
    ["/reports", "PEDAGOGICO"],
    ["/guardian", "PEDAGOGICO"],
    ["/api/courses", "PEDAGOGICO"],
    ["/api/reports", "PEDAGOGICO"],
    ["/api/lesson-plan", "PEDAGOGICO"],
    ["/api/students/[id]/reports", "PEDAGOGICO"],

    ["/inscription", "ADMINISTRATIVO"],
    ["/complete-profile", "ADMINISTRATIVO"],
    ["/students", "ADMINISTRATIVO"],
    ["/guardians", "ADMINISTRATIVO"],
    ["/teachers", "ADMINISTRATIVO"],
    ["/enrollments", "ADMINISTRATIVO"],
    ["/payments", "ADMINISTRATIVO"],
    ["/administration", "ADMINISTRATIVO"],
    ["/guardian/payments", "ADMINISTRATIVO"],
    ["/api/students", "ADMINISTRATIVO"],
    ["/api/teachers", "ADMINISTRATIVO"],
    ["/api/institutes", "ADMINISTRATIVO"],

    ["/messages", "COMUNICACION"],
    ["/api/messages", "COMUNICACION"],
    ["/api/upload", "COMUNICACION"],

    ["/login", "ACCESO"],
    ["/forgot-password", "ACCESO"],
    ["/reset-password", "ACCESO"],
    ["/profile", "ACCESO"],
    ["/api/auth", "ACCESO"],
];

export function areaOf(action: string): ErrorArea {
    // "render /courses/[id]", "route /api/practice/chat", "action /payments"
    const route = action.match(/^\w+ (\/\S*)$/)?.[1];
    if (route) return areaOfRoute(route);

    const prefix = action.split(".")[0];
    return BY_ACTION[prefix] ?? "PLATAFORMA";
}

function areaOfRoute(route: string): ErrorArea {
    let best: [string, ErrorArea] | null = null;
    for (const entry of BY_ROUTE) {
        const [prefix] = entry;
        const matches = route === prefix || route.startsWith(`${prefix}/`);
        if (matches && (!best || prefix.length > best[0].length)) best = entry;
    }
    return best?.[1] ?? "PLATAFORMA";
}
