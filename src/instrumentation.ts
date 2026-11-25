import type { Instrumentation } from "next";

/**
 * Lo que se escapa sin `catch` (ARQ-09): una página que se cae al cargar, una
 * ruta de API que tira, una server action que no atrapa. Es lo que hoy termina
 * en los `error.tsx`, y por eso cuenta como visto por el usuario.
 *
 * Lo que sí se atrapa y se contesta con un `{ success: false }` no pasa por acá:
 * lo registra el `catch` con `reportError`, que sabe qué se estaba haciendo.
 *
 * Un `UserError` tampoco: no es una falla, es el sistema diciendo que no, igual que
 * en `userMessageFor`. Sin esto, cada cuenta dada de baja con la pestaña abierta
 * dejaba un «No autorizado.» en el panel y un mail (BUG-36).
 */
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
    // Por el nombre y no con `instanceof`: este archivo se empaqueta aparte, y su clase
    // no es la misma que tiró la acción.
    if ((error as { name?: unknown })?.name === "UserError") return;

    // **El import va adentro del `if`, no después de un `return` temprano.** Este
    // archivo se compila también para edge, donde no hay `crypto` ni Prisma; el
    // compilador sólo descarta la rama si la condición envuelve al import. Con
    // el `return` arrastraba `next-auth` al bundle de edge y el campus entero
    // respondía 500.
    if (process.env.NEXT_RUNTIME === "nodejs") {
        const { reportError } = await import("@/lib/errors/report");
        const digest = (error as { digest?: unknown })?.digest;

        await reportError(error, {
            action: `${context.routeType} ${context.routePath}`,
            shownToUser: true,
            // Sin la query: ahí pueden viajar un DNI o un token de un enlace.
            path: request.path.split("?")[0],
            context: { method: request.method, digest: typeof digest === "string" ? digest : undefined },
        });
    }
};
