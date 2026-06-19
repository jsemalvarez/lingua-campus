import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSignedUrl } from "@/lib/supabase-server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        // ── 1. Auth ──────────────────────────────────────────────────────────
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        const sessionUser = session.user as any;

        // ── 2. Params ────────────────────────────────────────────────────────
        const { searchParams } = new URL(req.url);
        const storagePath = searchParams.get("path");
        const threadId = searchParams.get("threadId");

        if (!storagePath || !threadId) {
            return NextResponse.json(
                { error: "Parámetros requeridos: path, threadId" },
                { status: 400 }
            );
        }

        // ── 3. Verify participant ────────────────────────────────────────────
        const isStudent = (sessionUser.roles || [sessionUser.role]).includes("STUDENT");
        const participant = await prisma.threadParticipant.findFirst({
            where: isStudent
                ? { threadId, studentId: sessionUser.id }
                : { threadId, userId: sessionUser.id },
        });

        if (!participant) {
            return NextResponse.json(
                { error: "No tenés acceso a este hilo." },
                { status: 403 }
            );
        }

        // ── 4. Generate signed URL (1 hour expiry) ───────────────────────────
        const signedUrl = await getSignedUrl(storagePath, 3600);

        return NextResponse.json({ url: signedUrl });
    } catch (err: any) {
        console.error("[messages/signed-url]", err);
        return NextResponse.json(
            { error: err.message ?? "Error interno del servidor." },
            { status: 500 }
        );
    }
}
