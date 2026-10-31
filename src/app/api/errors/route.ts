import { headers } from "next/headers";
import { getAuthContext } from "@/lib/authz";
import { getTenantByHost } from "@/lib/tenant";
import { reportError, type ErrorContext } from "@/lib/errors/report";

/**
 * POST /api/errors — lo que falla en el navegador (ARQ-09).
 *
 * El navegador no puede escribir en la base, así que avisa acá y esto lo registra
 * con el mismo `reportError` que el resto: misma huella, misma área, mismo mail.
 * Lo manda `reportClientError` (`src/lib/errors/client.ts`).
 *
 * **Cualquiera puede llamarla**, porque el formulario de inscripción es público y
 * lo que falla ahí es de lo que más importa. Por eso todo lo que llega se trata
 * como entrada hostil: la acción tiene que tener la forma de las nuestras, el
 * mensaje y el contexto se recortan, y hay un tope de avisos por minuto.
 *
 * Sin sesión, el instituto sale del dominio, como en el resto del campus.
 *
 * Siempre contesta 204: el navegador no hace nada con la respuesta, y un error
 * acá no puede convertirse en otro error allá.
 */

const MAX_PER_MINUTE = 20;
const ACTION = /^(?:[a-z][a-z-]*(?:\.[a-z][a-z-]*)*|navegador \/[\w\-[\]/]*)$/;

// Tope por quien llama. Es por instancia —en Vercel cada una tiene su memoria—,
// así que no es un límite exacto: alcanza para que un error en loop en un
// navegador no escriba miles de filas.
const recent = new Map<string, number[]>();

function allowed(key: string): boolean {
    const now = Date.now();
    const hits = (recent.get(key) ?? []).filter((t) => now - t < 60_000);
    if (hits.length >= MAX_PER_MINUTE) return false;
    hits.push(now);
    recent.set(key, hits);
    if (recent.size > 5_000) recent.clear();
    return true;
}

export async function POST(req: Request) {
    const none = new Response(null, { status: 204 });

    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return none;
    }

    const action = typeof body.action === "string" ? body.action : "";
    if (action.length > 120 || !ACTION.test(action)) return none;

    const auth = await getAuthContext().catch(() => null);
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "sin-ip";
    if (!allowed(auth?.userId ?? ip)) return none;

    const instituteId = auth?.instituteId ?? (await getTenantByHost(headersList.get("host") ?? "").catch(() => null))?.id ?? null;

    // Se rearma como un Error para que `describeError` lo trate igual que a los
    // del servidor: tipo y primera línea, limpia.
    const error = new Error(typeof body.message === "string" ? body.message.slice(0, 500) : "Sin mensaje");
    error.name = typeof body.name === "string" && /^\w{1,40}$/.test(body.name) ? body.name : "Error";

    await reportError(error, {
        action,
        auth,
        instituteId,
        shownToUser: body.shownToUser === true,
        path: typeof body.path === "string" ? body.path.split("?")[0].slice(0, 200) : undefined,
        context: { ...cleanContext(body.context), origen: "navegador" },
    });

    return none;
}

/** Sólo valores sueltos y pocos: es lo único que el navegador tiene para mandar. */
function cleanContext(raw: unknown): ErrorContext {
    if (!raw || typeof raw !== "object") return {};
    const out: ErrorContext = {};
    for (const [key, value] of Object.entries(raw).slice(0, 8)) {
        if (!/^\w{1,40}$/.test(key)) continue;
        if (typeof value === "string") out[key] = value.slice(0, 120);
        else if (typeof value === "number" || typeof value === "boolean") out[key] = value;
    }
    return out;
}
