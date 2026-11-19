"use client";

import { useState, type ReactNode } from "react";
import { BookOpen, Check, ChevronRight, Headphones, MessageSquare, Mic, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/dates";
import type { PracticeData, PracticeSession } from "@/app/dashboard/components/StudentPracticeView";
import { GREEN_TEXT, GREEN_TINT, MUTED } from "./practiceStyles";

type PracticeType = PracticeSession["type"];

const ROW_HOVER = "transition-colors hover:bg-[#fafafa] dark:hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary";

/** La última vez que hizo ese modo en esa clase, o `null` si nunca. */
export function lastSession(sessions: PracticeSession[], type: PracticeType): PracticeSession | null {
    return sessions
        .filter((s) => s.type === type)
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())[0] ?? null;
}

interface Mode {
    type: PracticeType;
    label: string;
    description: string;
    Icon: LucideIcon;
}

/** Los modos que la clase tiene cargados, en el orden en que se muestran. */
function modesOf(item: PracticeData): Mode[] {
    const modes: Mode[] = [];
    const phrases = item.speakingPhrases.length;
    if (phrases > 0) {
        modes.push({
            type: "SPEAKING",
            label: "Speaking",
            description: phrases === 1 ? "Una frase para decir en voz alta" : `${phrases} frases para decir en voz alta`,
            Icon: Mic,
        });
    }
    // Las preguntas del Listening se arman al entrar, así que acá no se sabe cuántas son.
    if (item.listeningText) {
        modes.push({ type: "LISTENING", label: "Listening", description: "Escuchá un audio y contestá preguntas", Icon: Headphones });
    }
    if (item.chatScenario) {
        modes.push({ type: "CHAT", label: "Conversación", description: "Una charla en inglés con la IA", Icon: MessageSquare });
    }
    return modes;
}

/**
 * «Hecha · 3 de 4» sale de lo que guardó la última vez: frases bien dichas en
 * Speaking, preguntas acertadas en Listening. La conversación no tiene aciertos
 * que contar, así que dice sólo «Hecha».
 */
function doneLabel(type: PracticeType, session: PracticeSession): string {
    if (type === "CHAT" || session.phrasesAttempted <= 0) return "Hecha";
    return `Hecha · ${session.phrasesCorrect} de ${session.phrasesAttempted}`;
}

function classStatus(item: PracticeData, modes: Mode[]): { text: string; complete: boolean } {
    const total = modes.length;
    const done = modes.filter((m) => lastSession(item.sessions, m.type)).length;
    if (done === 0) return { text: "Sin empezar", complete: false };
    if (done === total) return { text: total === 1 ? "Hecha" : `Las ${total} hechas`, complete: true };
    return { text: `${done} de ${total} hechas`, complete: false };
}

function CourseDot({ color }: { color: string }) {
    return <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />;
}

function ModeRows({ item, onStart }: { item: PracticeData; onStart: (type: PracticeType) => void }) {
    return (
        <ul>
            {modesOf(item).map(({ type, label, description, Icon }) => {
                const session = lastSession(item.sessions, type);
                return (
                    <li key={type} className="border-t border-[#f0f0f0] dark:border-border">
                        <button type="button" onClick={() => onStart(type)} className={cn("flex w-full items-center gap-3 px-4 py-3 text-left", ROW_HOVER)}>
                            <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-[10px]", GREEN_TINT, GREEN_TEXT)}>
                                <Icon className="size-5" aria-hidden />
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <span className="text-[15px] font-semibold text-foreground">{label}</span>
                                <span className={cn("text-[13px] leading-snug", MUTED)}>{description}</span>
                            </span>
                            {session ? (
                                <span className={cn("inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold", GREEN_TINT, GREEN_TEXT)}>
                                    <Check className="size-3.5" strokeWidth={2.5} aria-hidden />
                                    {doneLabel(type, session)}
                                </span>
                            ) : (
                                <ChevronRight className="size-[18px] shrink-0 text-[#8a8a8a]" aria-hidden />
                            )}
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}

function SectionTitle({ children }: { children: ReactNode }) {
    return <h2 className={cn("text-[11px] font-bold uppercase tracking-[0.08em]", MUTED)}>{children}</h2>;
}

/**
 * El inicio de la práctica: la última clase abierta, con sus modos a mano, y las
 * anteriores debajo, cerradas, cada una con cuántos modos lleva hechos. Al tocar
 * una anterior se abre ahí mismo.
 */
export function PracticeHome({ practiceData, isPreview, initialOpenId, onStart }: {
    practiceData: PracticeData[];
    isPreview: boolean;
    /** La clase anterior que arranca abierta: la de la que viene, al volver de un ejercicio. */
    initialOpenId: string | null;
    onStart: (item: PracticeData, type: PracticeType) => void;
}) {
    const [openId, setOpenId] = useState<string | null>(initialOpenId);

    const classes = [...practiceData]
        .filter((item) => modesOf(item).length > 0)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const [latest, ...previous] = classes;
    const severalCourses = new Set(classes.map((c) => c.courseId)).size > 1;

    return (
        <main className="px-4 pb-24 pt-5 sm:px-6 md:pb-12 md:pt-10">
            <div className="mx-auto flex max-w-2xl flex-col gap-5 animate-in fade-in duration-300">
                <header className="flex flex-col gap-1">
                    <h1 className="text-2xl font-extrabold tracking-tight text-foreground md:text-3xl">Práctica</h1>
                    <p className={cn("text-sm leading-relaxed md:text-base", MUTED)}>
                        {isPreview
                            ? "Así la ven tus alumnos. Lo que hagas acá no se guarda."
                            : "Lo que viste en clase, para repasarlo cuando quieras."}
                    </p>
                </header>

                {!latest ? (
                    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border px-6 py-10 text-center">
                        <span className={cn("mb-1 flex size-11 items-center justify-center rounded-xl", GREEN_TINT, GREEN_TEXT)}>
                            <BookOpen className="size-5" aria-hidden />
                        </span>
                        <p className="text-[15px] font-semibold text-foreground">Todavía no hay prácticas</p>
                        <p className={cn("max-w-xs text-sm leading-relaxed", MUTED)}>
                            Cuando se publique la práctica de una clase, la vas a encontrar acá.
                        </p>
                    </div>
                ) : (
                    <>
                        <section className="flex flex-col gap-2">
                            <SectionTitle>{isPreview ? "Esta clase" : "Última clase"}</SectionTitle>
                            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
                                <div className="flex flex-col gap-1 px-4 pb-2.5 pt-4">
                                    <p className={cn("flex items-center gap-2 text-xs font-medium", MUTED)}>
                                        <CourseDot color={latest.courseColor} />
                                        <span>{latest.courseName} · {formatDate(latest.date, "day", "weekdayDayMonth")}</span>
                                    </p>
                                    <p className="text-xl font-bold tracking-tight text-foreground">{latest.topic}</p>
                                </div>
                                <ModeRows item={latest} onStart={(type) => onStart(latest, type)} />
                            </div>
                        </section>

                        {previous.length > 0 && (
                            <section className="flex flex-col gap-2">
                                <SectionTitle>Clases anteriores</SectionTitle>
                                <ul className="flex flex-col gap-2">
                                    {previous.map((item) => {
                                        const open = openId === item.lessonPracticeId;
                                        const status = classStatus(item, modesOf(item));
                                        const panelId = `practica-${item.lessonPracticeId}`;
                                        return (
                                            <li key={item.lessonPracticeId} className="overflow-hidden rounded-xl border border-border bg-card">
                                                <button
                                                    type="button"
                                                    aria-expanded={open}
                                                    aria-controls={panelId}
                                                    onClick={() => setOpenId(open ? null : item.lessonPracticeId)}
                                                    className={cn("flex w-full items-center gap-3 py-3 pl-4 pr-3.5 text-left", ROW_HOVER)}
                                                >
                                                    <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                                        <span className={cn("flex items-center gap-2 text-xs font-medium", MUTED)}>
                                                            {severalCourses && <CourseDot color={item.courseColor} />}
                                                            <span className="truncate">
                                                                {severalCourses && `${item.courseName} · `}
                                                                {formatDate(item.date, "day", "weekdayDayMonth")}
                                                            </span>
                                                        </span>
                                                        <span className="truncate text-[15px] font-semibold text-foreground">{item.topic}</span>
                                                    </span>
                                                    <span
                                                        className={cn(
                                                            "inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[13px]",
                                                            status.complete ? cn("font-semibold", GREEN_TEXT) : cn("font-medium", MUTED),
                                                        )}
                                                    >
                                                        {status.complete && <Check className="size-3.5" strokeWidth={2.5} aria-hidden />}
                                                        {status.text}
                                                    </span>
                                                    <ChevronRight
                                                        aria-hidden
                                                        className={cn("size-[18px] shrink-0 text-[#8a8a8a] motion-safe:transition-transform", open && "rotate-90")}
                                                    />
                                                </button>
                                                {open && (
                                                    <div id={panelId}>
                                                        <ModeRows item={item} onStart={(type) => onStart(item, type)} />
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            </section>
                        )}
                    </>
                )}
            </div>
        </main>
    );
}
