import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAIProvider } from "@/lib/practice/providers/ai";
import type { ChatMessage } from "@/lib/practice/providers/ai/IAIProvider";

/**
 * POST /api/practice/chat
 *
 * Body: { messages: ChatMessage[], systemPrompt: string }
 *
 * Continúa la conversación del alumno con la IA usando el escenario
 * definido por el profesor.
 */
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response("No autorizado", { status: 401 });
    }

    try {
        const body = await req.json();
        const { messages, systemPrompt } = body;

        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return new Response("'messages' es requerido y debe ser un array", { status: 400 });
        }

        if (!systemPrompt || typeof systemPrompt !== "string") {
            return new Response("'systemPrompt' es requerido", { status: 400 });
        }

        // Safety limit: max 50 messages per session
        const safeMessages = (messages as ChatMessage[]).slice(-50);

        const provider = getAIProvider();
        const reply = await provider.chat(safeMessages, systemPrompt.trim());

        return Response.json({ reply });
    } catch (error: any) {
        console.error("[CHAT] Error:", error.message);
        return new Response("Error en el chat con IA", { status: 500 });
    }
}
