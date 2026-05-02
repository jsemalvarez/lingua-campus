import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAIProvider } from "@/lib/practice/providers/ai";
import type { ChatMessage } from "@/lib/practice/providers/ai/IAIProvider";

/**
 * POST /api/practice/chat
 *
 * Body: { messages: ChatMessage[], scenario: string }
 * - messages: conversation history (empty array = first turn, AI greets)
 * - scenario: teacher-defined scenario used as the system prompt
 *
 * Returns: { message: string }
 */
export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return new Response("No autorizado", { status: 401 });
    }

    try {
        const body = await req.json();
        const { messages, scenario } = body;

        if (!scenario || typeof scenario !== "string") {
            return new Response("'scenario' es requerido", { status: 400 });
        }

        // Empty messages = first turn. Send a synthetic user message to get AI to greet.
        const history: ChatMessage[] = Array.isArray(messages) && messages.length > 0
            ? (messages as ChatMessage[]).slice(-50)
            : [{ role: "user", content: "Hello, please start the conversation according to your role." }];

        const provider = getAIProvider();
        const reply = await provider.chat(history, scenario.trim());

        return Response.json({ message: reply });
    } catch (error: any) {
        console.error("[CHAT] Error:", error.message);
        return new Response("Error en el chat con IA", { status: 500 });
    }
}
