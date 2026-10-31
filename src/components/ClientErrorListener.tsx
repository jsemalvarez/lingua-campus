"use client";

import { useEffect } from "react";
import { normalizePath, reportClientError } from "@/lib/errors/client";

/**
 * Lo que se escapa sin `catch` en el navegador (ARQ-09): un botón que tira un
 * error de JavaScript, una promesa que nadie esperó. Es el `instrumentation.ts`
 * del navegador.
 *
 * Va como no visto: casi siempre es «toqué y no pasó nada», que la persona nota
 * pero no ve como cartel. Al panel, sin mail.
 *
 * Los errores que vienen de otro lado —extensiones del navegador, scripts de
 * terceros— se descartan por el archivo de origen: no son nuestros.
 */
export function ClientErrorListener() {
    useEffect(() => {
        const action = () => `navegador ${normalizePath(location.pathname)}`;

        const onError = (event: ErrorEvent) => {
            if (event.filename && !event.filename.startsWith(location.origin)) return;
            reportClientError(event.error ?? event.message, { action: action() });
        };
        const onRejection = (event: PromiseRejectionEvent) => {
            reportClientError(event.reason, { action: action() });
        };

        window.addEventListener("error", onError);
        window.addEventListener("unhandledrejection", onRejection);
        return () => {
            window.removeEventListener("error", onError);
            window.removeEventListener("unhandledrejection", onRejection);
        };
    }, []);

    return null;
}
