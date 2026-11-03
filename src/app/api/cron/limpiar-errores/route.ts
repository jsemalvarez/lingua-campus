import prisma from "@/lib/prisma";
import { reportError } from "@/lib/errors/report";

/**
 * GET /api/cron/limpiar-errores — la retención del registro de errores (ARQ-09).
 *
 * Borra los `ErrorEvent` de más de 90 días. Los `ErrorIssue` y sus
 * `ErrorIssueScope` quedan: el panel sigue sabiendo que un problema existió,
 * cuántas veces pasó y en qué institutos, aunque ya no tenga cada vez suelta.
 *
 * La llama el cron de Vercel una vez por día (`vercel.json`), sólo en el deploy
 * de producción de cada proyecto: stage limpia su base y prod la suya.
 *
 * **Sólo con `CRON_SECRET`.** Vercel la manda como `Authorization: Bearer …`.
 * Sin la variable configurada no borra nada: una ruta que borra no puede quedar
 * abierta por olvido.
 */

const RETENTION_DAYS = 90;

export async function GET(req: Request) {
    const secret = process.env.CRON_SECRET;
    if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
        return new Response(null, { status: 401 });
    }

    const before = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
    try {
        const { count } = await prisma.errorEvent.deleteMany({ where: { createdAt: { lt: before } } });
        return Response.json({ borrados: count, antesDe: before.toISOString() });
    } catch (error) {
        await reportError(error, { action: "plataforma.limpiar-errores", shownToUser: false, auth: null });
        return new Response(null, { status: 500 });
    }
}
