import { getAIProvider } from "@/lib/practice/providers/ai";
import { guardPracticeAi, readJsonBody } from "@/lib/practice/guard";
import type { ChatMessage } from "@/lib/practice/providers/ai/IAIProvider";

/**
 * POST /api/practice/chat
 *
 * Body: { lessonPracticeId: string, messages: ChatMessage[] }
 * - lessonPracticeId: la práctica; de ahí sale el escenario
 * - messages: historial de la conversación (array vacío = primer turno)
 *
 * Devuelve: { message: string }
 *
 * El `scenario` **ya no viaja en el body**: era el system prompt y venía del
 * cliente, así que cualquiera con sesión escribía el prompt (SEC-07). Se lee de
 * `LessonPractice.chatScenario`, que es donde lo dejó el profesor.
 */

const MAX_TURNS = 50;
const MAX_MESSAGE_CHARS = 1000;

/**
 * El historial sí llega del cliente —no se persiste todavía, eso es PED-04— así
 * que se lo trata como entrada hostil: sólo los dos roles válidos, largo acotado
 * y un tope de turnos.
 */
function sanitizeHistory(raw: unknown): ChatMessage[] {
    if (!Array.isArray(raw)) return [];

    return raw
        .filter((m): m is ChatMessage =>
            !!m && typeof m === "object" &&
            (m.role === "user" || m.role === "assistant") &&
            typeof m.content === "string"
        )
        .map((m) => ({ role: m.role, content: m.content.trim().slice(0, MAX_MESSAGE_CHARS) }))
        .filter((m) => m.content.length > 0)
        .slice(-MAX_TURNS);
}

export async function POST(req: Request) {
    const body = await readJsonBody(req);
    const guard = await guardPracticeAi(body.lessonPracticeId);
    if (!guard.ok) return guard.response;

    const scenario = guard.practice.chatScenario?.trim();
    if (!scenario) {
        return new Response("La práctica no tiene un escenario de conversación", { status: 409 });
    }

    try {
        const history = sanitizeHistory(body.messages);

        // Sin historial es el primer turno: se manda un mensaje sintético para que
        // la IA arranque saludando en su rol.
        const messages: ChatMessage[] = history.length > 0
            ? history
            : [{ role: "user", content: "Hello, please start the conversation according to your role." }];

        const provider = getAIProvider();
        const reply = await provider.chat(messages, scenario);

        return Response.json({ message: reply });
    } catch (error: any) {
        console.error("[CHAT] Error:", error.message);
        return new Response("Error en el chat con IA", { status: 500 });
    }
}
