import { useSyncExternalStore } from "react";

/**
 * El punto de «nuevo» sobre Recursos en el menú del docente. Vive en el
 * navegador: se apaga la primera vez que el docente abre la página en ese
 * dispositivo, y no hace falta más que eso para un aviso de novedad.
 *
 * Si el almacenamiento está bloqueado, se toma como visto: mejor no avisar que
 * dejar un punto que no se puede apagar.
 */
const KEY = "lingua-recursos-visto";

function hasSeenResources(): boolean {
    try {
        return localStorage.getItem(KEY) === "1";
    } catch {
        return true;
    }
}

export function markResourcesSeen(): void {
    try {
        localStorage.setItem(KEY, "1");
    } catch {
        // Sin almacenamiento no hay marca que guardar; `hasSeenResources` ya da visto.
    }
}

function subscribe(onChange: () => void): () => void {
    window.addEventListener("storage", onChange);
    return () => window.removeEventListener("storage", onChange);
}

/**
 * `true` mientras el docente no abrió Recursos en este dispositivo. En el
 * servidor y durante la hidratación da `false`, así el menú no cambia entre
 * el HTML y el primer render del cliente.
 */
export function useResourcesIsNew(): boolean {
    return useSyncExternalStore(subscribe, () => !hasSeenResources(), () => false);
}
