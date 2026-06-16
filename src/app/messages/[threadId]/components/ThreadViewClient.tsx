"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { sendMessage, getThread } from "@/app/actions/messages";
import {
    ArrowLeft,
    Send,
    Users,
    BookOpen,
    Paperclip,
    Link2,
    X,
    FileText,
    FileSpreadsheet,
    File,
    Download,
    ExternalLink,
    Eye,
    ImageIcon,
    ZoomIn,
    ZoomOut,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ThreadDetail } from "@/app/actions/messages";
import type { LinkPreviewData } from "@/app/api/messages/link-preview/route";

const POLL_INTERVAL_MS = 10_000;

const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

interface Props {
    thread: ThreadDetail;
    currentUserId: string;
    isStudent: boolean;
    activeRole: string;
}

interface AttachmentPreview {
    file: File;
    localUrl: string; // objectURL for images
}

function formatDateTime(date: Date): string {
    return new Date(date).toLocaleString("es-AR", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Splits text into segments of plain text and URLs, rendering URLs as
 * clickable <a> tags that open in a new tab.
 */
function linkify(text: string, isMine: boolean): React.ReactNode {
    const URL_REGEX = /(https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?()])/g;
    const parts = text.split(URL_REGEX);

    return parts.map((part, i) => {
        if (URL_REGEX.test(part)) {
            URL_REGEX.lastIndex = 0; // reset after test
            return (
                <a
                    key={i}
                    href={part}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                        "underline underline-offset-2 break-all transition-opacity hover:opacity-75",
                        isMine ? "text-primary-foreground" : "text-primary"
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                    {part}
                </a>
            );
        }
        return part;
    });
}

function getMimeIcon(mime: string) {
    if (mime.startsWith("image/")) return <ImageIcon size={18} className="shrink-0" />;
    if (mime === "application/pdf") return <FileText size={18} className="shrink-0 text-red-500" />;
    if (mime.includes("spreadsheet") || mime.includes("excel"))
        return <FileSpreadsheet size={18} className="shrink-0 text-green-600" />;
    return <File size={18} className="shrink-0 text-blue-500" />;
}

function isImage(mime: string) {
    return mime.startsWith("image/");
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Card shown for document attachments (PDF, Word, Excel) */
function DocumentCard({
    name,
    mime,
    sizeBytes,
    storagePath,
    threadId,
    isMine,
}: {
    name: string;
    mime: string;
    sizeBytes: number | null;
    storagePath: string;
    threadId: string;
    isMine: boolean;
}) {
    const [loading, setLoading] = useState(false);

    async function getUrl() {
        setLoading(true);
        try {
            const res = await fetch(
                `/api/messages/signed-url?path=${encodeURIComponent(storagePath)}&threadId=${threadId}`
            );
            const data = await res.json();
            if (!data.url) throw new Error("No URL");
            return data.url as string;
        } finally {
            setLoading(false);
        }
    }

    async function handleView() {
        const url = await getUrl();
        window.open(url, "_blank", "noopener,noreferrer");
    }

    async function handleDownload() {
        const url = await getUrl();
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        a.click();
    }

    const isPdf = mime === "application/pdf";

    return (
        <div
            className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 mt-2 border",
                isMine
                    ? "bg-primary-foreground/10 border-primary-foreground/20"
                    : "bg-muted/60 border-border/60"
            )}
        >
            <div className={cn("p-2 rounded-lg", isMine ? "bg-primary-foreground/20" : "bg-background")}>
                {getMimeIcon(mime)}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{name}</p>
                {sizeBytes && (
                    <p className="text-xs opacity-60">{formatBytes(sizeBytes)}</p>
                )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
                {isPdf && (
                    <button
                        onClick={handleView}
                        disabled={loading}
                        className={cn(
                            "flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors",
                            isMine
                                ? "bg-primary-foreground/20 hover:bg-primary-foreground/30"
                                : "bg-primary/10 hover:bg-primary/20 text-primary"
                        )}
                    >
                        <Eye size={12} />
                        Ver
                    </button>
                )}
                <button
                    onClick={handleDownload}
                    disabled={loading}
                    className={cn(
                        "flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors",
                        isMine
                            ? "bg-primary-foreground/20 hover:bg-primary-foreground/30"
                            : "bg-muted hover:bg-muted/80"
                    )}
                >
                    <Download size={12} />
                    {loading ? "..." : "Descargar"}
                </button>
            </div>
        </div>
    );
}

/** Inline image with click-to-zoom */
function InlineImage({
    storagePath,
    threadId,
    fileName,
}: {
    storagePath: string;
    threadId: string;
    fileName: string;
}) {
    const [src, setSrc] = useState<string | null>(null);
    const [zoomed, setZoomed] = useState(false);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    // Ensure portal only renders client-side
    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        let cancelled = false;
        fetch(
            `/api/messages/signed-url?path=${encodeURIComponent(storagePath)}&threadId=${threadId}`
        )
            .then((r) => r.json())
            .then((d) => {
                if (!cancelled && d.url) setSrc(d.url);
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [storagePath, threadId]);

    // Lock body scroll when lightbox is open
    useEffect(() => {
        if (zoomed) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [zoomed]);

    // Close on Escape key
    useEffect(() => {
        if (!zoomed) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") setZoomed(false);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [zoomed]);

    async function handleDownload() {
        if (!src) return;
        const a = document.createElement("a");
        a.href = src;
        a.download = fileName;
        a.target = "_blank";
        a.click();
    }

    if (loading) {
        return (
            <div className="mt-2 h-32 w-48 rounded-xl bg-muted animate-pulse" />
        );
    }
    if (!src) return null;

    const lightbox = zoomed && mounted ? createPortal(
        <div
            style={{ position: "fixed", inset: 0, zIndex: 9999, height: "100dvh", width: "100vw" }}
            className="bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center cursor-zoom-out"
            onClick={() => setZoomed(false)}
        >
            {/* Toolbar */}
            <div
                className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent"
                onClick={(e) => e.stopPropagation()}
            >
                <p className="text-white/70 text-sm truncate max-w-[60%]">{fileName}</p>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDownload}
                        className="flex items-center gap-1.5 text-sm text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-colors"
                        title="Descargar imagen"
                    >
                        <Download size={15} />
                        Descargar
                    </button>
                    <button
                        onClick={() => setZoomed(false)}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
                        title="Cerrar (Esc)"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* Image */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src}
                alt={fileName}
                style={{ maxHeight: "calc(100dvh - 80px)", maxWidth: "calc(100vw - 32px)" }}
                className="object-contain rounded-xl shadow-2xl cursor-default"
                onClick={(e) => e.stopPropagation()}
            />
        </div>,
        document.body
    ) : null;

    return (
        <>
            <div
                className="mt-2 cursor-zoom-in overflow-hidden rounded-xl border border-border/40 max-w-[280px] group relative"
                onClick={() => setZoomed(true)}
                title="Click para ampliar"
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={src}
                    alt={fileName}
                    className="w-full h-auto object-cover max-h-60 hover:scale-105 transition-transform duration-200"
                />
                {/* Zoom hint overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <ZoomIn size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                </div>
            </div>
            {lightbox}
        </>
    );
}

/** Open Graph link preview card */
function LinkCard({
    url,
    title,
    description,
    image,
    siteName,
    isMine,
}: {
    url: string;
    title: string | null;
    description: string | null;
    image: string | null;
    siteName: string | null;
    isMine: boolean;
}) {
    return (
        <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
                "flex gap-3 rounded-xl mt-2 overflow-hidden border transition-opacity hover:opacity-80",
                isMine
                    ? "bg-primary-foreground/10 border-primary-foreground/20"
                    : "bg-muted/60 border-border/60"
            )}
        >
            {image && (
                <div className="w-20 shrink-0 bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={image}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                        }}
                    />
                </div>
            )}
            <div className="flex-1 min-w-0 py-2.5 pr-3">
                <p className="text-[11px] opacity-50 font-medium mb-0.5 uppercase tracking-wide">
                    {siteName ?? new URL(url).hostname}
                </p>
                {title && (
                    <p className="text-sm font-semibold line-clamp-2 leading-snug">{title}</p>
                )}
                {description && (
                    <p className="text-xs opacity-60 line-clamp-2 mt-0.5">{description}</p>
                )}
                <span className="inline-flex items-center gap-1 text-xs mt-1.5 opacity-50">
                    <ExternalLink size={10} />
                    Abrir enlace
                </span>
            </div>
        </a>
    );
}

/** Link preview card shown in the composer before sending */
function ComposerLinkPreview({
    preview,
    onRemove,
}: {
    preview: LinkPreviewData;
    onRemove: () => void;
}) {
    return (
        <div className="relative flex gap-2.5 rounded-xl border border-border/60 bg-muted/40 p-2.5 text-sm">
            {preview.image && (
                <div className="w-14 h-14 shrink-0 rounded-lg overflow-hidden bg-muted">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview.image} alt="" className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                </div>
            )}
            <div className="flex-1 min-w-0">
                <p className="text-[10px] text-muted-foreground uppercase font-medium tracking-wide">
                    {preview.siteName ?? new URL(preview.url).hostname}
                </p>
                <p className="font-medium text-sm line-clamp-1 mt-0.5">
                    {preview.title ?? preview.url}
                </p>
                {preview.description && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                        {preview.description}
                    </p>
                )}
            </div>
            <button
                type="button"
                onClick={onRemove}
                className="shrink-0 p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
                <X size={14} />
            </button>
        </div>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ThreadViewClient({ thread, currentUserId, isStudent, activeRole }: Props) {
    const [messages, setMessages] = useState(thread.messages);
    const [body, setBody] = useState("");
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const bottomRef = useRef<HTMLDivElement>(null);

    // Attachment state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [attachment, setAttachment] = useState<AttachmentPreview | null>(null);
    const [attachmentError, setAttachmentError] = useState<string | null>(null);

    // Link state
    const [showLinkInput, setShowLinkInput] = useState(false);
    const [linkInputValue, setLinkInputValue] = useState("");
    const [linkPreview, setLinkPreview] = useState<LinkPreviewData | null>(null);
    const [linkPreviewLoading, setLinkPreviewLoading] = useState(false);
    const linkDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ── Scroll on new messages ──
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // ── Polling ──
    useEffect(() => {
        const poll = async () => {
            try {
                const updated = await getThread({ threadId: thread.id, currentUserId, isStudent });
                if (!updated) return;
                setMessages((prev) => {
                    if (updated.messages.length === prev.length) return prev;
                    return updated.messages;
                });
            } catch { /* silent */ }
        };
        const timer = setInterval(poll, POLL_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [thread.id, currentUserId, isStudent]);

    // ── File selection ──
    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!fileInputRef.current) return;
        fileInputRef.current.value = "";

        setAttachmentError(null);
        if (!file) return;

        if (!ALLOWED_MIME_TYPES.includes(file.type)) {
            setAttachmentError("Tipo de archivo no permitido. Solo imágenes, PDF, Word o Excel.");
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            setAttachmentError("El archivo supera el límite de 5 MB.");
            return;
        }

        const localUrl = isImage(file.type) ? URL.createObjectURL(file) : "";
        setAttachment({ file, localUrl });
        // Remove link if switching to file
        setShowLinkInput(false);
        setLinkInputValue("");
        setLinkPreview(null);
    }

    function removeAttachment() {
        if (attachment?.localUrl) URL.revokeObjectURL(attachment.localUrl);
        setAttachment(null);
        setAttachmentError(null);
    }

    // ── Link input + debounced preview fetch ──
    const fetchLinkPreview = useCallback(async (url: string) => {
        if (!url) { setLinkPreview(null); return; }
        try {
            new URL(url); // validate
        } catch { setLinkPreview(null); return; }

        setLinkPreviewLoading(true);
        try {
            const res = await fetch(`/api/messages/link-preview?url=${encodeURIComponent(url)}`);
            const data: LinkPreviewData = await res.json();
            setLinkPreview(data);
        } catch {
            setLinkPreview(null);
        } finally {
            setLinkPreviewLoading(false);
        }
    }, []);

    function handleLinkInput(value: string) {
        setLinkInputValue(value);
        if (linkDebounceRef.current) clearTimeout(linkDebounceRef.current);
        linkDebounceRef.current = setTimeout(() => fetchLinkPreview(value), 800);
    }

    function removeLink() {
        setLinkInputValue("");
        setLinkPreview(null);
        setShowLinkInput(false);
    }

    function toggleLinkInput() {
        if (showLinkInput) {
            removeLink();
        } else {
            removeAttachment();
            setShowLinkInput(true);
        }
    }

    // ── Send ──
    async function handleSend(e: React.FormEvent) {
        e.preventDefault();
        const hasBody = body.trim().length > 0;
        const hasFile = !!attachment;
        const hasLink = !!linkInputValue.trim();

        if (!hasBody && !hasFile && !hasLink) return;

        setSending(true);
        setError(null);

        try {
            let attachmentPath: string | undefined;
            let attachmentName: string | undefined;
            let attachmentMime: string | undefined;
            let attachmentSize: number | undefined;

            // 1. Upload file if present
            if (attachment) {
                const form = new FormData();
                form.append("file", attachment.file);
                form.append("threadId", thread.id);

                const uploadRes = await fetch("/api/upload/message-attachment", {
                    method: "POST",
                    body: form,
                });

                if (!uploadRes.ok) {
                    const { error: uploadError } = await uploadRes.json();
                    throw new Error(uploadError ?? "Error al subir el archivo.");
                }

                const uploadData = await uploadRes.json();
                attachmentPath = uploadData.storagePath;
                attachmentName = uploadData.fileName;
                attachmentMime = uploadData.mimeType;
                attachmentSize = uploadData.sizeBytes;
            }

            // 2. Send message
            await sendMessage({
                threadId: thread.id,
                body,
                senderUserId: isStudent ? undefined : currentUserId,
                senderStudentId: isStudent ? currentUserId : undefined,
                senderRole: activeRole,
                attachmentPath,
                attachmentName,
                attachmentMime,
                attachmentSize,
                sharedUrl: hasLink ? linkInputValue.trim() : undefined,
                sharedUrlTitle: linkPreview?.title ?? undefined,
                sharedUrlDesc: linkPreview?.description ?? undefined,
                sharedUrlImage: linkPreview?.image ?? undefined,
            });

            // 3. Reset state
            setBody("");
            removeAttachment();
            removeLink();

            // 4. Refresh messages
            const updated = await getThread({ threadId: thread.id, currentUserId, isStudent });
            if (updated) setMessages(updated.messages);
        } catch (err: any) {
            setError(err.message ?? "Error al enviar el mensaje.");
        } finally {
            setSending(false);
        }
    }

    // ── Derived state ──
    const hasContent = body.trim().length > 0 || !!attachment || !!linkInputValue.trim();

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-400">
            {/* Header */}
            <div className="space-y-3">
                <Link
                    href="/messages"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                    <ArrowLeft size={15} />
                    Volver a mensajes
                </Link>

                <div className="bg-card border border-border/60 rounded-2xl p-5">
                    <h1 className="text-xl font-bold text-foreground">{thread.subject}</h1>

                    <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-muted-foreground">
                        {thread.courseName && (
                            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted font-medium">
                                <BookOpen size={11} />
                                {thread.courseName}
                            </span>
                        )}
                        <span className="flex items-center gap-1.5">
                            <Users size={11} />
                            {thread.participants.length}{" "}
                            {thread.participants.length === 1 ? "participante" : "participantes"}
                        </span>
                        <span>
                            {new Date(thread.createdAt).toLocaleDateString("es-AR", {
                                day: "2-digit",
                                month: "long",
                                year: "numeric",
                            })}
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {thread.participants.map((p) => (
                            <span
                                key={p.id}
                                className={cn(
                                    "text-[11px] px-2 py-0.5 rounded-full font-medium",
                                    p.isAuthor
                                        ? "bg-primary/10 text-primary"
                                        : "bg-muted text-muted-foreground"
                                )}
                            >
                                {p.name}
                                {p.isAuthor && " (autor)"}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="space-y-4">
                {messages.map((msg) => {
                    const isMine = msg.isCurrentUser;
                    const hasAttachment = !!msg.attachmentPath;
                    const hasLink = !!msg.sharedUrl;

                    return (
                        <div
                            key={msg.id}
                            className={cn(
                                "flex flex-col gap-1",
                                isMine ? "items-end" : "items-start"
                            )}
                        >
                            {/* Sender name + time */}
                            <div
                                className={cn(
                                    "flex items-center gap-2 text-xs text-muted-foreground px-1",
                                    isMine && "flex-row-reverse"
                                )}
                            >
                                <span className="font-medium">{msg.senderName}</span>
                                <span>·</span>
                                <span>{formatDateTime(msg.createdAt)}</span>
                            </div>

                            {/* Bubble */}
                            <div
                                className={cn(
                                    "max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm",
                                    isMine
                                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                                        : "bg-card border border-border/60 text-foreground rounded-tl-sm"
                                )}
                            >
                                {/* Text body — URLs are auto-linkified */}
                                {msg.body && (
                                    <p className="whitespace-pre-wrap break-words">
                                        {linkify(msg.body, isMine)}
                                    </p>
                                )}

                                {/* Image attachment */}
                                {hasAttachment && msg.attachmentMime && isImage(msg.attachmentMime) && (
                                    <InlineImage
                                        storagePath={msg.attachmentPath!}
                                        threadId={thread.id}
                                        fileName={msg.attachmentName ?? "imagen"}
                                    />
                                )}

                                {/* Document attachment */}
                                {hasAttachment && msg.attachmentMime && !isImage(msg.attachmentMime) && (
                                    <DocumentCard
                                        name={msg.attachmentName ?? "archivo"}
                                        mime={msg.attachmentMime}
                                        sizeBytes={msg.attachmentSize ?? null}
                                        storagePath={msg.attachmentPath!}
                                        threadId={thread.id}
                                        isMine={isMine}
                                    />
                                )}

                                {/* Shared link */}
                                {hasLink && (
                                    <LinkCard
                                        url={msg.sharedUrl!}
                                        title={msg.sharedUrlTitle ?? null}
                                        description={msg.sharedUrlDesc ?? null}
                                        image={msg.sharedUrlImage ?? null}
                                        siteName={null}
                                        isMine={isMine}
                                    />
                                )}
                            </div>
                        </div>
                    );
                })}
                <div ref={bottomRef} />
            </div>

            {/* ── Reply composer ── */}
            <div className="sticky bottom-4">
                <form
                    onSubmit={handleSend}
                    className="bg-card border border-border/60 rounded-2xl p-4 shadow-lg space-y-3"
                >
                    {/* Errors */}
                    {(error || attachmentError) && (
                        <p className="text-sm text-red-500 px-1">{error ?? attachmentError}</p>
                    )}

                    {/* Attachment preview (before sending) */}
                    {attachment && (
                        <div className="flex items-center gap-2.5 rounded-xl border border-border/60 bg-muted/40 px-3 py-2.5">
                            {isImage(attachment.file.type) ? (
                                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-muted">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={attachment.localUrl}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <div className="p-2 rounded-lg bg-background shrink-0">
                                    {getMimeIcon(attachment.file.type)}
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{attachment.file.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {formatBytes(attachment.file.size)}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={removeAttachment}
                                className="p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    {/* Link input area */}
                    {showLinkInput && (
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="url"
                                    value={linkInputValue}
                                    onChange={(e) => handleLinkInput(e.target.value)}
                                    placeholder="https://..."
                                    className="flex-1 text-sm bg-muted/40 border border-border/60 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground"
                                />
                                <button
                                    type="button"
                                    onClick={removeLink}
                                    className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                            {linkPreviewLoading && (
                                <p className="text-xs text-muted-foreground px-1 animate-pulse">
                                    Cargando preview...
                                </p>
                            )}
                            {linkPreview && !linkPreviewLoading && (
                                <ComposerLinkPreview
                                    preview={linkPreview}
                                    onRemove={removeLink}
                                />
                            )}
                        </div>
                    )}

                    {/* Textarea */}
                    <textarea
                        id="reply-body"
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                                handleSend(e as any);
                            }
                        }}
                        placeholder={
                            attachment
                                ? "Agregá un comentario al archivo (opcional)..."
                                : showLinkInput
                                ? "Agregá un comentario al link (opcional)..."
                                : "Escribí tu respuesta..."
                        }
                        rows={3}
                        className="w-full resize-none bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />

                    {/* Bottom bar */}
                    <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5">
                            {/* Hidden file input */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.xls,.xlsx"
                                className="hidden"
                                onChange={handleFileChange}
                                id="attachment-input"
                            />
                            {/* Clip button */}
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                title="Adjuntar archivo"
                                className={cn(
                                    "p-2 rounded-xl transition-colors",
                                    attachment
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                <Paperclip size={16} />
                            </button>
                            {/* Link button */}
                            <button
                                type="button"
                                onClick={toggleLinkInput}
                                title="Compartir link"
                                className={cn(
                                    "p-2 rounded-xl transition-colors",
                                    showLinkInput
                                        ? "bg-primary/10 text-primary"
                                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                )}
                            >
                                <Link2 size={16} />
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <p className="text-xs text-muted-foreground hidden sm:block">
                                Ctrl + Enter para enviar
                            </p>
                            <Button
                                type="submit"
                                disabled={sending || !hasContent}
                                className="gap-2 h-9 px-4 rounded-xl text-sm font-semibold"
                            >
                                <Send size={14} />
                                {sending ? "Enviando..." : "Responder"}
                            </Button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
