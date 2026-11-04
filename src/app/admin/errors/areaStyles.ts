import { ERROR_AREAS, type ErrorArea } from "@/lib/errors/areas";

/** El color de cada área, en claro y en oscuro. Las clases van enteras para que Tailwind las encuentre. */
const STYLES: Record<ErrorArea, { badge: string; chip: string; bar: string }> = {
    PEDAGOGICO: {
        badge: "bg-blue-50 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
        chip: "bg-blue-50 text-blue-800 border-blue-800 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-400",
        bar: "bg-blue-500",
    },
    PRACTICA_IA: {
        badge: "bg-violet-50 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300",
        chip: "bg-violet-50 text-violet-800 border-violet-800 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-400",
        bar: "bg-violet-500",
    },
    RECURSOS_DOCENTE: {
        badge: "bg-teal-50 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300",
        chip: "bg-teal-50 text-teal-800 border-teal-800 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-400",
        bar: "bg-teal-500",
    },
    ADMINISTRATIVO: {
        badge: "bg-orange-50 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300",
        chip: "bg-orange-50 text-orange-800 border-orange-800 dark:bg-orange-950/60 dark:text-orange-300 dark:border-orange-400",
        bar: "bg-orange-500",
    },
    COMUNICACION: {
        badge: "bg-pink-50 text-pink-800 dark:bg-pink-950/60 dark:text-pink-300",
        chip: "bg-pink-50 text-pink-800 border-pink-800 dark:bg-pink-950/60 dark:text-pink-300 dark:border-pink-400",
        bar: "bg-pink-500",
    },
    ACCESO: {
        badge: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        chip: "bg-slate-100 text-slate-700 border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-400",
        bar: "bg-slate-500",
    },
    PLATAFORMA: {
        badge: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
        chip: "bg-stone-100 text-stone-700 border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-400",
        bar: "bg-stone-500",
    },
};

export const AREA_KEYS = Object.keys(ERROR_AREAS) as ErrorArea[];

export function isErrorArea(value: string | undefined | null): value is ErrorArea {
    return !!value && value in ERROR_AREAS;
}

export function areaLabel(area: string): string {
    return isErrorArea(area) ? ERROR_AREAS[area] : area;
}

export function areaStyle(area: string) {
    return STYLES[isErrorArea(area) ? area : "PLATAFORMA"];
}
