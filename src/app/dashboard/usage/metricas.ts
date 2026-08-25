import { signsForThemselves } from "@/lib/reports/signatures";

/**
 * Las clasificaciones del panel de uso (FEAT-11), en un solo lugar.
 *
 * **Por qué no viven en la pantalla que las muestra.** Cada número del panel
 * tiene detrás un listado que lo abre, y los dos tienen que contar exactamente
 * lo mismo: un mosaico que dice 7 y una lista que trae 6 no se lee como un error
 * de una de las dos, se lee como que el panel miente. Con la regla escrita dos
 * veces eso pasa la primera vez que alguien toca una y no la otra, y pasa en
 * silencio.
 */

/** Los cinco estados de la métrica 4, en el orden en que se evalúan. */
export type EstadoAlumno =
    | "con-cuenta"
    | "con-datos"
    | "sin-nada"
    | "firma-solo"
    | "sin-fecha";

export interface AlumnoClasificable {
    birthDate: Date | null;
    guardian1Name: string | null;
    guardian1Email: string | null;
    guardian2Name: string | null;
    guardian2Email: string | null;
    /** Cuántas cuentas de tutor tiene vinculadas. */
    vinculos: number;
}

/**
 * En qué situación está el alumno respecto de su tutor.
 *
 * **El orden importa y no es alfabético.** Los dos chequeos de tutor van primero
 * para que "mayor de 20" quede sólo con los que no tienen ninguno: ahí es donde
 * sirve, sacando de la lista de faltantes a quien no necesita tutor
 * (FEAT-09). Al revés, un alumno de 22 con su tutor cargado saldría del conteo
 * de vinculados sin motivo.
 */
export function clasificarAlumno(alumno: AlumnoClasificable, hoy: Date): EstadoAlumno {
    if (alumno.vinculos > 0) return "con-cuenta";

    const tieneDatosDeTutor = Boolean(
        alumno.guardian1Name ||
        alumno.guardian1Email ||
        alumno.guardian2Name ||
        alumno.guardian2Email
    );
    if (tieneDatosDeTutor) return "con-datos";

    if (signsForThemselves(alumno.birthDate, hoy)) return "firma-solo";
    if (!alumno.birthDate) return "sin-fecha";
    return "sin-nada";
}

/** Los tres estados de la métrica 1. */
export type EstadoParte = "completa" | "incompleta" | "sin-parte";

/**
 * Cómo quedó el parte de asistencia de una clase.
 *
 * **Tres estados y no dos.** Una clase con algunas marcas y no todas es alguien
 * que empezó y no terminó —o el escáner de la puerta sin que el docente cerrara
 * el parte—, y es el caso que más vale ver. Con dos estados se pierde adentro de
 * "tiene parte".
 */
export function estadoDelParte(marcas: number, inscriptos: number): EstadoParte {
    if (marcas === 0) return "sin-parte";
    if (marcas < inscriptos) return "incompleta";
    return "completa";
}

/**
 * Si la práctica de una clase tiene contenido de verdad.
 *
 * `LessonPractice` puede existir vacía —`speakingPhrases: []` con los otros dos
 * en `null`—, y contar esa fila sería contar trabajo que nadie hizo.
 */
export function practicaTieneContenido(p: {
    speakingPhrases: string[];
    listeningText: string | null;
    chatScenario: string | null;
}): boolean {
    return p.speakingPhrases.length > 0 || Boolean(p.listeningText) || Boolean(p.chatScenario);
}
