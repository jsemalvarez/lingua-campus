import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadToStorage } from "@/lib/supabase-server";
import prisma from "@/lib/prisma";
import { randomBytes } from "crypto";

// ─── Allowed MIME types ───────────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = new Set([
    // Images
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    // Documents
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export async function POST(req: NextRequest) {
    try {
        // ── 1. Auth ──────────────────────────────────────────────────────────
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: "No autorizado" }, { status: 401 });
        }
        const sessionUser = session.user as any;

        // ── 2. Parse multipart form ──────────────────────────────────────────
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const threadId = formData.get("threadId") as string | null;

        if (!file || !threadId) {
            return NextResponse.json(
                { error: "Faltan campos requeridos: file, threadId" },
                { status: 400 }
            );
        }

        // ── 3. Validate file ─────────────────────────────────────────────────
        if (!ALLOWED_MIME_TYPES.has(file.type)) {
            return NextResponse.json(
                {
                    error: "Tipo de archivo no permitido. Solo se aceptan imágenes, PDF, Word y Excel.",
                },
                { status: 400 }
            );
        }

        if (file.size > MAX_SIZE_BYTES) {
            return NextResponse.json(
                { error: "El archivo supera el límite de 5 MB." },
                { status: 400 }
            );
        }

        // ── 4. Verify sender is a participant of the thread ──────────────────
        const isStudent = (sessionUser.roles || [sessionUser.role]).includes("STUDENT");
        const participant = await prisma.threadParticipant.findFirst({
            where: isStudent
                ? { threadId, studentId: sessionUser.id }
                : { threadId, userId: sessionUser.id },
            include: { thread: { select: { instituteId: true } } },
        });

        if (!participant) {
            return NextResponse.json(
                { error: "No tenés acceso a este hilo." },
                { status: 403 }
            );
        }

        // Derive instituteId from the thread record — never trust the client
        const instituteId = participant.thread.instituteId;

        // ── 5. Build storage path ────────────────────────────────────────────
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
        const uniqueId = randomBytes(8).toString("hex");
        const timestamp = Date.now();
        const storagePath = `${instituteId}/${threadId}/${timestamp}-${uniqueId}.${ext}`;

        // ── 6. Upload to Supabase Storage ────────────────────────────────────
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        await uploadToStorage(buffer, storagePath, file.type);

        // ── 7. Return metadata (DB record created when message is sent) ──────
        return NextResponse.json({
            storagePath,
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
        });
    } catch (err: any) {
        console.error("[upload/message-attachment]", err);
        return NextResponse.json(
            { error: err.message ?? "Error interno del servidor." },
            { status: 500 }
        );
    }
}
