/**
 * El recorrido de la demo: diez placas que ve el instituto que está evaluando el
 * campus, en el orden en que se las muestra (aprobado el 10/11/2026 en el lienzo
 * «Placas de la demo»). Abre con lo pedagógico, por la misma razón que el hero de
 * la landing.
 *
 * El orden es también el guion de quien presenta: cada placa dice cuál sigue.
 */

export type EnlaceEnVivo = "armado" | "practica" | "firmas" | "inscripcion" | "asistencia" | "deudores" | "caja";

export type PasoDelRecorrido = {
    titulo: string;
    seccion: "Pedagógico" | "Administrativo" | "Familias" | "Empezar" | null;
    /** Qué pantalla real abre «Verlo en vivo», y lo que dice al lado. */
    enVivo?: { enlace: EnlaceEnVivo; leyenda: string };
};

export const RECORRIDO: PasoDelRecorrido[] = [
    { titulo: "Portada", seccion: null },
    { titulo: "Armar la clase", seccion: "Pedagógico", enVivo: { enlace: "armado", leyenda: "Abre el armado de una clase" } },
    {
        titulo: "De la clase de hoy a la práctica en casa",
        seccion: "Pedagógico",
        enVivo: { enlace: "practica", leyenda: "Abre la práctica de una clase" },
    },
    {
        titulo: "El boletín, firmado en el celular",
        seccion: "Pedagógico",
        enVivo: { enlace: "firmas", leyenda: "Abre las firmas de los informes" },
    },
    {
        titulo: "La pre-inscripción online",
        seccion: "Administrativo",
        enVivo: { enlace: "inscripcion", leyenda: "Abre el formulario de inscripción" },
    },
    {
        titulo: "Asistencia por clase",
        seccion: "Administrativo",
        enVivo: { enlace: "asistencia", leyenda: "Abre la asistencia de una clase" },
    },
    { titulo: "Sabés quién debe", seccion: "Administrativo", enVivo: { enlace: "deudores", leyenda: "Abre el reporte de deudores" } },
    { titulo: "La caja del mes", seccion: "Administrativo", enVivo: { enlace: "caja", leyenda: "Abre la caja del mes" } },
    // Sin «Verlo en vivo»: el portal de la familia se muestra en una ventana
    // privada aparte, con la cuenta de la familia de Sofía, abierta antes de la
    // demo. La pestaña de «Verlo en vivo» tiene la sesión de la dirección, y en
    // el mismo navegador no caben dos sesiones del mismo instituto.
    { titulo: "Las familias, al tanto", seccion: "Familias" },
    { titulo: "Empezar es simple", seccion: "Empezar" },
];

/** Cuántas placas cuentan en el «x de 9»: todas menos la portada. */
export const TOTAL = RECORRIDO.length - 1;

export function hrefDePlaca(numero: number): string {
    return numero === 0 ? "/admin/demo" : `/admin/demo?placa=${numero}`;
}

/**
 * El nombre de la pestaña donde se abre lo real. Es siempre la misma: la demo
 * queda en una pestaña y el instituto demo en la otra, en vez de sumar una
 * pestaña nueva por cada «Verlo en vivo».
 */
export const PESTANA_EN_VIVO = "lingua-demo-en-vivo";
