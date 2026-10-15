"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import {
    AlertCircle,
    ArrowDown,
    Check,
    ChevronDown,
    ChevronRight,
    CloudCheck,
    Compass,
    Copy,
    Download,
    ExternalLink,
    FileSpreadsheet,
    Flag,
    House,
    Lightbulb,
    Loader2,
    Pencil,
    Plus,
    RefreshCw,
    Sparkles,
    Sunrise,
    Target,
    X,
    type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import {
    ageLabel,
    contentLabel,
    copyLabel,
    copyText,
    FOCUSES,
    isExternalTool,
    kahootFileName,
    loadSteps,
    MAX_WORD_CHARS,
    MAX_WORDS,
    MOMENTS,
    selectedIdea,
    toolLabel,
    youglishUrl,
    type AgeRange,
    type ExternalTool,
    type KahootQuestion,
    type MomentId,
    type PlanIdea,
    type PlanMoments,
    type PlanPair,
    type PlanWord,
} from "@/lib/lessonPlan/plan";
import { KAHOOT_SECONDS, kahootXlsx } from "@/lib/lessonPlan/kahootXlsx";
import { TOOLS } from "@/app/resources/tools";
import { cn } from "@/lib/utils";
import { ErrorNote, FIELD, MUTED, PRIMARY_BUTTON, PRIMARY_TEXT, SectionHeader } from "./ui";

/** El color de cada momento: el mismo en su tarjeta, en el plan y en la barra. */
const MOMENT_STYLE: Record<
    MomentId,
    { Icon: LucideIcon; head: string; ink: string; dot: string; ring: string; tint: string; chip: string; step: string; side: string }
> = {
    inicio: {
        Icon: Sunrise,
        step: "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
        side: "text-orange-700 dark:text-orange-400",
        head: "bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-900/50",
        ink: "text-orange-700 dark:text-orange-400",
        dot: "bg-orange-500",
        ring: "border-orange-600 dark:border-orange-500",
        tint: "bg-orange-50 dark:bg-orange-950/30",
        chip: "bg-orange-700 dark:bg-orange-600",
    },
    principal: {
        Icon: Target,
        step: "bg-[#d5efe8] text-[#1f7360] dark:bg-primary/20 dark:text-primary",
        side: PRIMARY_TEXT,
        head: "bg-[#ebf7f4] border-[#bfe5da] dark:bg-primary/10 dark:border-primary/30",
        ink: PRIMARY_TEXT,
        dot: "bg-primary",
        ring: "border-[#1f7360] dark:border-primary",
        tint: "bg-[#ebf7f4] dark:bg-primary/10",
        chip: "bg-[#1f7360] dark:bg-primary",
    },
    cierre: {
        Icon: Flag,
        step: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
        side: "text-blue-700 dark:text-blue-400",
        head: "bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900/50",
        ink: "text-blue-700 dark:text-blue-400",
        dot: "bg-blue-500",
        ring: "border-blue-700 dark:border-blue-500",
        tint: "bg-blue-50 dark:bg-blue-950/30",
        chip: "bg-blue-700 dark:bg-blue-600",
    },
    tarea: {
        Icon: House,
        step: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300",
        side: "text-violet-700 dark:text-violet-400",
        head: "bg-violet-50 border-violet-200 dark:bg-violet-950/30 dark:border-violet-900/50",
        ink: "text-violet-700 dark:text-violet-400",
        dot: "bg-violet-500",
        ring: "border-violet-700 dark:border-violet-500",
        tint: "bg-violet-50 dark:bg-violet-950/30",
        chip: "bg-violet-700 dark:bg-violet-600",
    },
};

const GHOST_BUTTON =
    "inline-flex h-10 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold text-foreground transition-colors hover:bg-card/80 disabled:cursor-not-allowed disabled:opacity-50 sm:h-9";
const OUTLINE_BUTTON =
    "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 text-sm font-semibold text-foreground transition-colors hover:bg-muted/40 disabled:cursor-not-allowed disabled:opacity-60";

// ─── 2. Palabras de la clase ─────────────────────────────────────────────────

export type IdeasState = "none" | "fresh" | "stale";

export function WordsSection({
    canWrite,
    focus,
    onFocusChange,
    words,
    onWordsChange,
    blocked,
    busy,
    onSuggest,
    onPropose,
    ideasState,
    error,
    confirming,
    onConfirm,
    onCancelConfirm,
}: {
    canWrite: boolean;
    focus: string | null;
    onFocusChange: (focus: string | null) => void;
    words: PlanWord[];
    onWordsChange: (words: PlanWord[]) => void;
    /** Por qué todavía no se le puede pedir nada a la IA, o `null`. */
    blocked: string | null;
    busy: "words" | "ideas" | MomentId | null;
    onSuggest: () => void;
    onPropose: () => void;
    ideasState: IdeasState;
    error: string | null;
    /** Pedir ideas nuevas cuando ya hay elegidas: se confirma antes de reemplazar. */
    confirming: boolean;
    onConfirm: () => void;
    onCancelConfirm: () => void;
}) {
    const [newWord, setNewWord] = useState("");
    const chosen = words.filter((w) => w.on).length;
    const full = words.length >= MAX_WORDS;
    const disabled = !canWrite || busy !== null;

    const toggle = (text: string) => onWordsChange(words.map((w) => (w.text === text ? { ...w, on: !w.on } : w)));
    const remove = (text: string) => onWordsChange(words.filter((w) => w.text !== text));
    const add = (event: FormEvent) => {
        event.preventDefault();
        const text = newWord.trim().slice(0, MAX_WORD_CHARS);
        if (!text) return;
        const existing = words.find((w) => w.text.toLowerCase() === text.toLowerCase());
        if (existing) {
            if (!existing.on) toggle(existing.text);
        } else if (!full) {
            onWordsChange([...words, { text, on: true, own: true }]);
        }
        setNewWord("");
    };

    const status =
        words.length === 0
            ? null
            : chosen === 0
              ? { text: "Tildá al menos una palabra para pedir ideas.", warn: true }
              : ideasState === "stale"
                ? { text: "Cambiaste las palabras o el foco: pedí ideas nuevas para que los usen.", warn: true }
                : ideasState === "fresh"
                  ? { text: "Las ideas de abajo salieron de estas palabras.", warn: false }
                  : { text: "Con estas palabras armamos tres ideas para cada momento de la clase.", warn: false };

    return (
        <section id="palabras" aria-labelledby="titulo-palabras" className="scroll-mt-24 space-y-4">
            <SectionHeader
                n={2}
                titleId="titulo-palabras"
                title="Palabras de la clase"
                description="Las sugerimos a partir del tema y los contenidos. Destildá las que no van y sumá las tuyas: de acá salen las ideas para la clase y la práctica de los alumnos."
            />
            <Card className="space-y-5 p-4 sm:space-y-6 sm:p-6">
                <div className="space-y-2.5">
                    <span id="foco-etiqueta" className="block text-[13px] font-semibold">
                        ¿En qué se enfoca la clase?
                    </span>
                    <div role="group" aria-labelledby="foco-etiqueta" className="flex flex-wrap gap-2">
                        {FOCUSES.map((f) => {
                            const on = focus === f;
                            return (
                                <button
                                    key={f}
                                    type="button"
                                    aria-pressed={on}
                                    disabled={disabled}
                                    onClick={() => onFocusChange(on ? null : f)}
                                    className={cn(
                                        "h-10 rounded-full border px-3.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed",
                                        on
                                            ? "border-[#23806a] bg-[#23806a] text-white"
                                            : "border-border bg-card text-foreground hover:bg-muted/40 disabled:opacity-70"
                                    )}
                                >
                                    {f}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="space-y-2.5">
                    <div className="flex items-baseline justify-between gap-3">
                        <span id="palabras-etiqueta" className="text-[13px] font-semibold">
                            Palabras
                        </span>
                        {words.length > 0 && (
                            <span className={cn("text-[13px]", MUTED)}>
                                {chosen} de {words.length} elegidas
                            </span>
                        )}
                    </div>
                    {words.length === 0 ? (
                        <p className={cn("rounded-lg border border-dashed border-border p-3.5 text-[13.5px] leading-normal", MUTED)}>
                            Todavía no hay palabras. Pedile a la IA que las sugiera a partir del tema, o sumá las tuyas.
                        </p>
                    ) : (
                        <div role="group" aria-labelledby="palabras-etiqueta" className="flex flex-wrap gap-2">
                            {words.map((w) => (
                                <WordChip
                                    key={w.text}
                                    word={w}
                                    disabled={disabled}
                                    onToggle={() => toggle(w.text)}
                                    onRemove={w.own ? () => remove(w.text) : undefined}
                                />
                            ))}
                        </div>
                    )}
                    {canWrite && (
                        <form onSubmit={add} className="flex max-w-md gap-2 pt-1">
                            <label htmlFor="nueva-palabra" className="sr-only">
                                Sumá una palabra o una frase
                            </label>
                            <input
                                id="nueva-palabra"
                                type="text"
                                value={newWord}
                                onChange={(e) => setNewWord(e.target.value)}
                                maxLength={MAX_WORD_CHARS}
                                disabled={disabled || full}
                                placeholder={full ? `Llegaste a ${MAX_WORDS} palabras` : "Sumá una palabra o una frase"}
                                className={cn(FIELD, "h-11 min-w-0 flex-1 text-sm sm:text-sm")}
                            />
                            <button type="submit" disabled={disabled || full || !newWord.trim()} className={cn(OUTLINE_BUTTON, "px-3.5 sm:px-4")}>
                                <Plus className="size-4" />
                                <span className="sr-only sm:not-sr-only">Agregar</span>
                            </button>
                        </form>
                    )}
                </div>

                {canWrite && blocked && (
                    <p className={cn("flex items-start gap-2 rounded-lg bg-muted/40 p-3 text-[13.5px] leading-normal", MUTED)}>
                        <AlertCircle className="mt-0.5 size-4 shrink-0" />
                        {blocked}
                    </p>
                )}
                {error && <ErrorNote>{error}</ErrorNote>}

                {confirming && (
                    <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-800/50 dark:bg-amber-950/30">
                        <p className="text-sm leading-normal text-amber-900 dark:text-amber-200">
                            Las ideas nuevas reemplazan a las de abajo y a las que elegiste. Las que escribiste vos se quedan.
                        </p>
                        <div className="flex gap-2">
                            <button type="button" onClick={onConfirm} className={cn("h-10 rounded-lg px-4 text-sm font-semibold", PRIMARY_BUTTON)}>
                                Reemplazar
                            </button>
                            <button
                                type="button"
                                onClick={onCancelConfirm}
                                className="h-10 rounded-lg px-4 text-sm font-semibold transition-colors hover:bg-amber-100 dark:hover:bg-amber-900/40"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                {canWrite && (
                    <div className="flex flex-col gap-3 border-t border-border/70 pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
                        {words.length === 0 ? (
                            <button
                                type="button"
                                onClick={onSuggest}
                                disabled={disabled || !!blocked}
                                className={cn("inline-flex h-12 items-center justify-center gap-2 rounded-lg px-[18px] text-[15px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:text-[14.5px]", PRIMARY_BUTTON)}
                            >
                                {busy === "words" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                                {busy === "words" ? "Buscando palabras…" : "Sugerir palabras"}
                            </button>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={onPropose}
                                    disabled={disabled || !!blocked || chosen === 0}
                                    className={cn("inline-flex h-12 items-center justify-center gap-2 rounded-lg px-[18px] text-[15px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:h-11 sm:text-[14.5px]", PRIMARY_BUTTON)}
                                >
                                    {busy === "ideas" ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : ideasState === "none" ? (
                                        <Sparkles className="size-4" />
                                    ) : (
                                        <RefreshCw className="size-4" />
                                    )}
                                    {busy === "ideas"
                                        ? "Escribiendo las ideas…"
                                        : ideasState === "none"
                                          ? "Proponer ideas para la clase"
                                          : "Proponer ideas otra vez"}
                                </button>
                                <button type="button" onClick={onSuggest} disabled={disabled || !!blocked || full} className={OUTLINE_BUTTON}>
                                    {busy === "words" ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                                    {busy === "words" ? "Buscando palabras…" : "Sugerir más palabras"}
                                </button>
                            </>
                        )}
                        {status && (
                            <span className={cn("text-[13px] leading-normal", status.warn ? "font-semibold text-amber-700 dark:text-amber-400" : MUTED)}>
                                {busy === "ideas" ? "Tarda unos segundos: son doce ideas con su contenido." : status.text}
                            </span>
                        )}
                    </div>
                )}
            </Card>
        </section>
    );
}

function WordChip({
    word,
    disabled,
    onToggle,
    onRemove,
}: {
    word: PlanWord;
    disabled: boolean;
    onToggle: () => void;
    onRemove?: () => void;
}) {
    return (
        <span
            className={cn(
                "inline-flex h-10 items-stretch overflow-hidden rounded-[10px] border text-sm font-semibold transition-colors",
                word.on
                    ? cn("border-[#bfe5da] bg-[#ebf7f4] dark:border-primary/40 dark:bg-primary/10", PRIMARY_TEXT)
                    : cn("border-border bg-card", MUTED)
            )}
        >
            <button
                type="button"
                aria-pressed={word.on}
                onClick={onToggle}
                disabled={disabled}
                className={cn("inline-flex items-center gap-2 pl-2.5 disabled:cursor-not-allowed", onRemove ? "pr-2" : "pr-3.5")}
            >
                <span
                    aria-hidden="true"
                    className={cn(
                        "flex size-[18px] items-center justify-center rounded-[5px]",
                        word.on ? "bg-[#23806a]" : "border-[1.5px] border-neutral-400"
                    )}
                >
                    {word.on && <Check className="size-3 text-white" strokeWidth={3.5} />}
                </span>
                {word.text}
            </button>
            {onRemove && (
                <button
                    type="button"
                    onClick={onRemove}
                    disabled={disabled}
                    aria-label={`Quitar «${word.text}»`}
                    className="flex w-8 items-center justify-center border-l border-current/15 opacity-70 transition-opacity hover:opacity-100 disabled:cursor-not-allowed"
                >
                    <X className="size-3.5" />
                </button>
            )}
        </span>
    );
}

// ─── 3. Armar la clase ───────────────────────────────────────────────────────

export type OwnIdeaInput = { title: string; minutes: number; description: string; lines: string[] };

export function MomentsSection({
    canWrite,
    moments,
    studentCount,
    ages,
    level,
    busy,
    errors,
    askBlocked,
    onPick,
    onMore,
    onSaveOwn,
    onStartManual,
    onOpenGuide,
}: {
    canWrite: boolean;
    moments: PlanMoments | null;
    studentCount: number;
    ages: AgeRange | null;
    level: string | null;
    busy: "words" | "ideas" | MomentId | null;
    errors: Partial<Record<MomentId, string>>;
    /** Por qué no se pueden pedir ideas, o `null`. */
    askBlocked: string | null;
    onPick: (moment: MomentId, ideaId: string) => void;
    onMore: (moment: MomentId) => void;
    onSaveOwn: (moment: MomentId, idea: OwnIdeaInput | null) => void;
    onStartManual: () => void;
    onOpenGuide: (tool: ExternalTool) => void;
}) {
    // «un grupo de 5 alumnos de 13 a 16 años, nivel Upper-intermediate»: el
    // docente ve con qué edad se pidieron las ideas, y si algo no cierra lo nota.
    const group = studentCount > 0 ? `un grupo de ${studentCount} ${studentCount === 1 ? "alumno" : "alumnos"}` : "tu grupo";
    const ageText = ages ? ` de ${ageLabel(ages)}` : "";
    const levelText = level?.trim() ? `${ages ? "," : ""} ${ages ? "nivel " : "de "}${level.trim()}` : "";

    return (
        <section id="armar" aria-labelledby="titulo-armar" className="scroll-mt-24 space-y-4">
            <SectionHeader
                n={3}
                titleId="titulo-armar"
                title="Armar la clase"
                description={`Tres ideas por momento, pensadas para ${group}${ageText}${levelText}. Elegí una, pedí otras o escribí la tuya.`}
            />
            {moments === null && busy !== "ideas" ? (
                <Card className="flex flex-col items-start gap-3 p-4 sm:p-6">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/30">
                        <Lightbulb className="size-[22px]" />
                    </span>
                    <div className="space-y-1">
                        <h3 className="text-base font-bold">Todavía no hay ideas</h3>
                        <p className={cn("max-w-xl text-[13.5px] leading-normal sm:text-sm", MUTED)}>
                            Elegí las palabras de la clase y tocá «Proponer ideas para la clase»: te traemos tres ideas para
                            el inicio, la actividad principal, el cierre y la tarea, cada una con su contenido listo para usar.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-1">
                        <a href="#palabras" className={OUTLINE_BUTTON}>
                            <ArrowDown className="size-4 rotate-180" />
                            Ir a las palabras
                        </a>
                        {canWrite && (
                            <button type="button" onClick={onStartManual} className={cn(OUTLINE_BUTTON, "border-transparent bg-transparent")}>
                                <Pencil className="size-4" />
                                Armarla sin la IA
                            </button>
                        )}
                    </div>
                </Card>
            ) : (
                <div className="flex flex-col gap-4 sm:gap-5">
                    {MOMENTS.map((m) => (
                        <MomentCard
                            key={m.id}
                            momentId={m.id}
                            name={m.name}
                            sub={m.sub}
                            ideas={moments?.[m.id].ideas ?? []}
                            selected={selectedIdea(moments?.[m.id])}
                            canWrite={canWrite}
                            busy={busy}
                            error={errors[m.id] ?? null}
                            askBlocked={askBlocked}
                            onPick={(id) => onPick(m.id, id)}
                            onMore={() => onMore(m.id)}
                            onSaveOwn={(idea) => onSaveOwn(m.id, idea)}
                            onOpenGuide={onOpenGuide}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}

function MomentCard({
    momentId,
    name,
    sub,
    ideas,
    selected,
    canWrite,
    busy,
    error,
    askBlocked,
    onPick,
    onMore,
    onSaveOwn,
    onOpenGuide,
}: {
    momentId: MomentId;
    name: string;
    sub: string;
    ideas: PlanIdea[];
    selected: PlanIdea | null;
    canWrite: boolean;
    busy: "words" | "ideas" | MomentId | null;
    error: string | null;
    askBlocked: string | null;
    onPick: (ideaId: string) => void;
    onMore: () => void;
    onSaveOwn: (idea: OwnIdeaInput | null) => void;
    onOpenGuide: (tool: ExternalTool) => void;
}) {
    const style = MOMENT_STYLE[momentId];
    const [writing, setWriting] = useState(false);
    const own = ideas.find((idea) => idea.own) ?? null;
    const loading = busy === momentId || busy === "ideas";
    const headId = `momento-${momentId}`;

    return (
        <article aria-labelledby={headId} aria-busy={loading} className="overflow-hidden rounded-xl border border-border bg-card shadow-xs">
            <header className={cn("flex flex-col gap-2 border-b px-3.5 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-3.5 sm:pl-[18px]", style.head)}>
                <div className="flex min-w-0 items-center gap-3">
                    <span aria-hidden="true" className={cn("flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-card shadow-xs", style.ink)}>
                        <style.Icon className="size-5" />
                    </span>
                    <div className="min-w-0">
                        <h3 id={headId} className="text-[17px] font-bold leading-snug sm:text-lg">
                            {name}
                        </h3>
                        <p className={cn("text-[12.5px] sm:text-[13px]", MUTED)}>{sub}</p>
                    </div>
                </div>
                {canWrite && (
                    <div className="grid shrink-0 grid-cols-2 gap-1 sm:flex">
                        <button
                            type="button"
                            onClick={onMore}
                            disabled={busy !== null || !!askBlocked}
                            title={askBlocked ?? undefined}
                            className={cn(GHOST_BUTTON, "justify-center bg-card/70")}
                        >
                            {busy === momentId ? <Loader2 className="size-[15px] animate-spin" /> : <RefreshCw className="size-[15px]" />}
                            {busy === momentId ? "Buscando…" : ideas.some((idea) => !idea.own && idea.tool !== "campus") ? "Otras ideas" : "Pedir ideas"}
                        </button>
                        <button
                            type="button"
                            onClick={() => setWriting(true)}
                            disabled={busy !== null || writing}
                            className={cn(GHOST_BUTTON, "justify-center bg-card/70")}
                        >
                            <Pencil className="size-[15px]" />
                            {own ? "Editar la mía" : "Escribir la mía"}
                        </button>
                    </div>
                )}
            </header>

            <div className="space-y-2 p-2.5 sm:p-3">
                {loading && busy === "ideas" ? (
                    <IdeasSkeleton />
                ) : (
                    <>
                        {ideas.length === 0 && !writing && (
                            <p className={cn("px-2 py-3 text-[13.5px] leading-normal", MUTED)}>
                                Sin ideas todavía.{" "}
                                {canWrite && (askBlocked ? "Escribí la tuya." : "Pedí ideas o escribí la tuya.")}
                            </p>
                        )}
                        {ideas.map((idea) => (
                            <IdeaRow
                                key={idea.id}
                                idea={idea}
                                momentId={momentId}
                                selected={selected?.id === idea.id}
                                disabled={!canWrite || busy !== null}
                                onPick={() => onPick(idea.id)}
                            />
                        ))}
                        {busy === momentId && <IdeasSkeleton count={1} />}
                    </>
                )}
                {writing && (
                    <OwnIdeaForm
                        momentId={momentId}
                        initial={own}
                        onCancel={() => setWriting(false)}
                        onSave={(idea) => {
                            onSaveOwn(idea);
                            setWriting(false);
                        }}
                    />
                )}
                {error && <ErrorNote>{error}</ErrorNote>}
            </div>

            {selected ? (
                <ContentReady momentId={momentId} momentName={name} idea={selected} onOpenGuide={onOpenGuide} />
            ) : (
                ideas.length > 0 &&
                !loading && <p className={cn("px-4 pb-4 text-[13px] sm:px-5", MUTED)}>Elegí una idea para ver su contenido listo.</p>
            )}
        </article>
    );
}

function IdeasSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="space-y-2" aria-hidden="true">
            {Array.from({ length: count }, (_, i) => (
                <div key={i} className="flex animate-pulse gap-3.5 rounded-[10px] border border-border/70 p-4">
                    <span className="size-5 shrink-0 rounded-full bg-muted" />
                    <span className="flex-1 space-y-2">
                        <span className="block h-3.5 w-1/3 rounded bg-muted" />
                        <span className="block h-3 w-4/5 rounded bg-muted/70" />
                    </span>
                </div>
            ))}
        </div>
    );
}

function ideaFacts(idea: PlanIdea, momentId: MomentId) {
    return momentId === "tarea" ? `En casa · ${idea.minutes} min` : `${idea.minutes} min · ${idea.grouping}`;
}

function IdeaRow({
    idea,
    momentId,
    selected,
    disabled,
    onPick,
}: {
    idea: PlanIdea;
    momentId: MomentId;
    selected: boolean;
    disabled: boolean;
    onPick: () => void;
}) {
    const style = MOMENT_STYLE[momentId];
    return (
        <button
            type="button"
            aria-pressed={selected}
            onClick={onPick}
            disabled={disabled}
            className={cn(
                "flex w-full items-start gap-3 rounded-[10px] p-3.5 text-left transition-colors sm:gap-3.5 sm:px-4",
                selected ? cn("border-[1.5px]", style.ring, style.tint) : "border border-border/80 bg-card hover:bg-muted/30",
                disabled && "cursor-default"
            )}
        >
            <span
                aria-hidden="true"
                className={cn(
                    "mt-px flex size-5 shrink-0 items-center justify-center rounded-full border-2 bg-card",
                    selected ? style.ring : "border-neutral-400"
                )}
            >
                {selected && <span className={cn("size-2.5 rounded-full", style.chip)} />}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="text-[15px] font-semibold leading-snug">{idea.title}</span>
                    {selected && <span className={cn("rounded-full px-2 py-0.5 text-[11.5px] font-bold text-white", style.chip)}>Elegida</span>}
                    {idea.own && (
                        <span className="rounded-full border border-border px-2 py-0.5 text-[11.5px] font-semibold text-foreground">Tuya</span>
                    )}
                </span>
                {idea.description && <span className={cn("text-[13.5px] leading-normal", MUTED)}>{idea.description}</span>}
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1 pt-0.5 sm:hidden">
                    <ToolChip idea={idea} />
                    <span className={cn("text-xs", MUTED)}>{ideaFacts(idea, momentId)}</span>
                </span>
            </span>
            <span className="hidden w-[150px] shrink-0 flex-col items-end gap-1.5 sm:flex">
                <ToolChip idea={idea} />
                <span className={cn("text-right text-xs leading-snug", MUTED)}>{ideaFacts(idea, momentId)}</span>
            </span>
        </button>
    );
}

function ToolChip({ idea }: { idea: PlanIdea }) {
    return (
        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {toolLabel(idea.tool)}
        </span>
    );
}

function OwnIdeaForm({
    momentId,
    initial,
    onSave,
    onCancel,
}: {
    momentId: MomentId;
    initial: PlanIdea | null;
    onSave: (idea: OwnIdeaInput | null) => void;
    onCancel: () => void;
}) {
    const [title, setTitle] = useState(initial?.title ?? "");
    const [minutes, setMinutes] = useState(String(initial?.minutes ?? (momentId === "principal" ? 25 : 10)));
    const [description, setDescription] = useState(initial?.description ?? "");
    const [content, setContent] = useState(initial?.lines.join("\n") ?? "");
    const id = `propia-${momentId}`;

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (!title.trim()) return;
        onSave({
            title: title.trim(),
            minutes: Math.max(1, Math.min(240, Math.round(Number(minutes)) || 10)),
            description: description.trim(),
            lines: content.split("\n").map((l) => l.trim()).filter(Boolean),
        });
    };

    return (
        <form onSubmit={submit} className="space-y-3.5 rounded-[10px] border border-border bg-muted/20 p-3.5 sm:p-4">
            <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_120px]">
                <div className="space-y-1.5">
                    <label htmlFor={`${id}-titulo`} className="text-[13px] font-semibold">
                        Qué van a hacer
                    </label>
                    <input
                        id={`${id}-titulo`}
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={120}
                        required
                        autoFocus
                        placeholder="Ej: Bingo con los verbos de la clase"
                        className={cn(FIELD, "h-11")}
                    />
                </div>
                <div className="space-y-1.5">
                    <label htmlFor={`${id}-minutos`} className="text-[13px] font-semibold">
                        Minutos
                    </label>
                    <input
                        id={`${id}-minutos`}
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={240}
                        value={minutes}
                        onChange={(e) => setMinutes(e.target.value)}
                        className={cn(FIELD, "h-11")}
                    />
                </div>
            </div>
            <div className="space-y-1.5">
                <label htmlFor={`${id}-como`} className="text-[13px] font-semibold">
                    Cómo es <span className={cn("font-normal", MUTED)}>(opcional)</span>
                </label>
                <textarea
                    id={`${id}-como`}
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={600}
                    className={cn(FIELD, "resize-y py-2.5 leading-relaxed")}
                />
            </div>
            <div className="space-y-1.5">
                <label htmlFor={`${id}-contenido`} className="text-[13px] font-semibold">
                    Contenido listo <span className={cn("font-normal", MUTED)}>(opcional)</span>
                </label>
                <textarea
                    id={`${id}-contenido`}
                    rows={3}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Lo que vas a decir, proyectar o pegar. Un renglón por línea."
                    className={cn(FIELD, "resize-y py-2.5 leading-relaxed")}
                />
            </div>
            <div className="flex flex-wrap gap-2">
                <button type="submit" disabled={!title.trim()} className={cn("h-10 rounded-lg px-4 text-sm font-semibold disabled:opacity-60", PRIMARY_BUTTON)}>
                    {initial ? "Guardar los cambios" : "Sumar la mía"}
                </button>
                <button type="button" onClick={onCancel} className="h-10 rounded-lg px-4 text-sm font-semibold transition-colors hover:bg-muted/50">
                    Cancelar
                </button>
                {initial && (
                    <button
                        type="button"
                        onClick={() => onSave(null)}
                        className="h-10 rounded-lg px-4 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 sm:ml-auto"
                    >
                        Quitar la mía
                    </button>
                )}
            </div>
        </form>
    );
}

// ─── Contenido listo ─────────────────────────────────────────────────────────

/**
 * Copia al portapapeles y deja «Copiado» un par de segundos en lo que se copió
 * (`key`). Si el navegador no deja usar el portapapeles, copia con una caja de
 * texto escondida.
 */
function useCopy() {
    const [copiedKey, setCopiedKey] = useState<string | null>(null);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => () => {
        if (timer.current) clearTimeout(timer.current);
    }, []);
    const copy = async (key: string, text: string) => {
        let ok = false;
        try {
            await navigator.clipboard.writeText(text);
            ok = true;
        } catch {
            const area = document.createElement("textarea");
            area.value = text;
            area.setAttribute("readonly", "");
            area.style.position = "fixed";
            area.style.opacity = "0";
            document.body.appendChild(area);
            area.select();
            try {
                ok = document.execCommand("copy");
            } catch {
                ok = false;
            }
            document.body.removeChild(area);
        }
        if (timer.current) clearTimeout(timer.current);
        setCopiedKey(ok ? key : null);
        if (ok) timer.current = setTimeout(() => setCopiedKey(null), 2000);
    };
    return { copiedKey, copy };
}

/** Descarga la planilla de Kahoot de la idea. */
function downloadKahoot(idea: PlanIdea) {
    if (!idea.questions?.length) return;
    const bytes = kahootXlsx(idea.questions);
    const blob = new Blob([bytes as BlobPart], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = kahootFileName(idea);
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Lo que se copia o se descarga va en una caja propia, con su botón adentro. */
function hasContentBox(idea: PlanIdea): boolean {
    return !!idea.questions?.length || !!idea.pairs?.length || (idea.tool === "wordwall" && idea.lines.length > 0);
}

const SMALL_LABEL = cn("text-xs font-bold uppercase tracking-[0.06em]", MUTED);

/**
 * El contenido de la idea elegida. En la compu se despliega en la tarjeta; en
 * el celular se abre en una ventana que sube desde abajo, con los botones fijos
 * al pie, como en el lienzo.
 */
function ContentReady({
    momentId,
    momentName,
    idea,
    onOpenGuide,
}: {
    momentId: MomentId;
    momentName: string;
    idea: PlanIdea;
    onOpenGuide: (tool: ExternalTool) => void;
}) {
    const [open, setOpen] = useState(false);
    const [sheet, setSheet] = useState(false);

    const onClick = () => {
        if (window.matchMedia("(min-width: 768px)").matches) setOpen((o) => !o);
        else setSheet(true);
    };

    return (
        <div className="px-2.5 pb-2.5 sm:px-3 sm:pb-3">
            <div className="rounded-[10px] border border-border/70 bg-muted/25">
                <button
                    type="button"
                    aria-expanded={open}
                    onClick={onClick}
                    className="flex min-h-12 w-full items-center justify-between gap-3 px-3.5 py-2 text-left sm:px-4"
                >
                    <span className="min-w-0">
                        <span className="block text-sm font-semibold md:inline">Contenido listo</span>
                        <span className={cn("block text-[12.5px] md:inline md:text-sm md:font-medium", MUTED)}>
                            <span className="hidden md:inline"> · </span>
                            {idea.title}
                        </span>
                    </span>
                    <ChevronDown className={cn("hidden size-[18px] shrink-0 transition-transform md:block", MUTED, open && "rotate-180")} />
                    <ChevronRight className={cn("size-[18px] shrink-0 md:hidden", MUTED)} />
                </button>
                {open && (
                    <div className="hidden px-4 pb-4 md:block">
                        <ContentBody idea={idea} momentId={momentId} onOpenGuide={onOpenGuide} withActions />
                    </div>
                )}
            </div>
            {sheet && (
                <ContentSheet
                    idea={idea}
                    momentId={momentId}
                    momentName={momentName}
                    onClose={() => setSheet(false)}
                    onOpenGuide={(tool) => {
                        setSheet(false);
                        onOpenGuide(tool);
                    }}
                />
            )}
        </div>
    );
}

function ContentBody({
    idea,
    momentId,
    onOpenGuide,
    withActions,
}: {
    idea: PlanIdea;
    momentId: MomentId;
    onOpenGuide: (tool: ExternalTool) => void;
    withActions: boolean;
}) {
    const tool = isExternalTool(idea.tool) ? TOOLS.find((t) => t.id === idea.tool) ?? null : null;
    const { copiedKey, copy } = useCopy();
    const label = hasContentBox(idea) ? null : copyLabel(idea);
    const style = MOMENT_STYLE[momentId];

    return (
        <div className="space-y-5">
            {idea.steps?.length ? (
                <div className="space-y-3">
                    <p className={SMALL_LABEL}>Cómo se hace</p>
                    <ol className="space-y-3">
                        {idea.steps.map((step, i) => (
                            <li key={i} className="flex gap-3 text-[14.5px] leading-normal">
                                <span
                                    aria-hidden="true"
                                    className={cn("flex size-6 shrink-0 items-center justify-center rounded-full text-[12.5px] font-extrabold", style.step)}
                                >
                                    {i + 1}
                                </span>
                                <span className="min-w-0 pt-px">{step}</span>
                            </li>
                        ))}
                    </ol>
                </div>
            ) : null}

            <div className="space-y-2.5">
                <p className={SMALL_LABEL}>{contentLabel(idea, momentId)}</p>
                {idea.questions?.length ? (
                    <KahootContent idea={idea} questions={idea.questions} />
                ) : idea.pairs?.length ? (
                    <PairsBox idea={idea} pairs={idea.pairs} sideClass={style.side} />
                ) : idea.tool === "wordwall" && idea.lines.length > 0 ? (
                    <ListBox idea={idea} />
                ) : (
                    idea.lines.length > 0 && (
                        <ul className="space-y-2 rounded-lg border border-border/70 bg-card px-4 py-3.5">
                            {idea.lines.map((line, i) => (
                                <li key={i} className="text-[14.5px] leading-normal md:text-sm">
                                    {line}
                                </li>
                            ))}
                        </ul>
                    )
                )}
            </div>
            {idea.note && (
                <div className="flex gap-2 rounded-lg bg-amber-50 p-3 dark:bg-amber-950/30">
                    <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-700 dark:text-amber-400" />
                    <p className="text-[13.5px] leading-normal">{idea.note}</p>
                </div>
            )}
            {idea.tool === "youglish" && idea.words?.length ? (
                <div className="flex flex-wrap gap-2">
                    {idea.words.map((word) => (
                        <a
                            key={word}
                            href={youglishUrl(word)}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Abrir YouGlish con «${word}»`}
                            className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-orange-200 bg-orange-50 px-3.5 text-[15px] font-semibold text-orange-800 transition-colors hover:bg-orange-100 dark:border-orange-900/50 dark:bg-orange-950/30 dark:text-orange-300 md:h-10 md:text-sm"
                        >
                            {word}
                            <ExternalLink className="size-[13px]" />
                        </a>
                    ))}
                </div>
            ) : null}
            {withActions ? (
                <div className="flex flex-wrap items-center gap-2">
                    {label && (
                        <button
                            type="button"
                            onClick={() => copy("todo", copyText(idea))}
                            className={cn("inline-flex h-10 items-center gap-1.5 rounded-lg px-3.5 text-sm font-semibold", PRIMARY_BUTTON)}
                        >
                            {copiedKey === "todo" ? <Check className="size-[15px]" /> : <Copy className="size-[15px]" />}
                            {copiedKey === "todo" ? "Copiado" : label}
                        </button>
                    )}
                    {tool && tool.id !== "youglish" && (
                        <a
                            href={tool.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Abrir ${tool.name} en otra pestaña`}
                            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 text-sm font-medium transition-colors hover:bg-muted/40"
                        >
                            Abrir {tool.name}
                            <ExternalLink className="size-[15px]" />
                        </a>
                    )}
                    {tool && <GuideButton name={tool.name} onClick={() => onOpenGuide(tool.id as ExternalTool)} />}
                    {idea.tool === "campus" && <PracticeLink />}
                </div>
            ) : (
                tool && <GuideButton name={tool.name} onClick={() => onOpenGuide(tool.id as ExternalTool)} />
            )}
        </div>
    );
}

/** «Cómo se importa» / «Cómo se pega», al pie de la caja: lo fija el sistema. */
function LoadSteps({ idea }: { idea: PlanIdea }) {
    const load = loadSteps(idea);
    if (!load) return null;
    return (
        <div className="space-y-2 border-t border-border/70 bg-muted/30 px-4 py-3.5">
            <p className="text-[13px] font-semibold">{load.title}</p>
            <ol className="list-decimal space-y-1 pl-[18px] text-[13.5px] leading-normal">
                {load.steps.map((step, i) => (
                    <li key={i}>{step}</li>
                ))}
            </ol>
        </div>
    );
}

function CopyAllButton({ copied, label, onClick }: { copied: boolean; label: string; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn("inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13.5px] font-semibold md:h-9", PRIMARY_BUTTON)}
        >
            {copied ? <Check className="size-[15px]" /> : <Copy className="size-[15px]" />}
            {copied ? "Copiado" : label}
        </button>
    );
}

/**
 * Kahoot no acepta preguntas pegadas, pero importa una planilla con la correcta
 * marcada: el archivo se arma acá. Si la cuenta del docente no deja importar,
 * quedan las preguntas para copiar de a una.
 */
function KahootContent({ idea, questions }: { idea: PlanIdea; questions: KahootQuestion[] }) {
    const [downloaded, setDownloaded] = useState(false);
    const [loose, setLoose] = useState(false);
    const { copiedKey, copy } = useCopy();
    const count = questions.length;

    return (
        <div className="space-y-4">
            <div className="overflow-hidden rounded-lg border border-border bg-card">
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-3.5">
                    <span className="flex min-w-0 flex-1 items-center gap-3.5">
                        <span aria-hidden="true" className={cn("flex size-11 shrink-0 items-center justify-center rounded-[10px] bg-[#ebf7f4] dark:bg-primary/10", PRIMARY_TEXT)}>
                            <FileSpreadsheet className="size-[22px]" />
                        </span>
                        <span className="flex min-w-0 flex-col gap-0.5">
                            <span className="truncate text-[15px] font-semibold">{kahootFileName(idea)}</span>
                            <span className={cn("text-[13px]", MUTED)}>
                                {count} {count === 1 ? "pregunta" : "preguntas"} con la correcta ya marcada · {KAHOOT_SECONDS} segundos cada una
                            </span>
                        </span>
                    </span>
                    <button
                        type="button"
                        onClick={() => {
                            downloadKahoot(idea);
                            setDownloaded(true);
                        }}
                        className={cn("inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-[10px] px-4 text-[14.5px] font-bold shadow-xs", PRIMARY_BUTTON)}
                    >
                        <Download className="size-4" />
                        {downloaded ? "Descargado" : "Descargar para Kahoot"}
                    </button>
                </div>
                <LoadSteps idea={idea} />
            </div>

            <div className="space-y-1.5">
                <p className="text-[13px] font-semibold">Lo que trae el archivo</p>
                <ol className="space-y-1.5">
                    {questions.map((q, k) => (
                        <li key={k} className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1 text-sm leading-normal">
                            <span className={cn("font-bold", MUTED)}>{k + 1}.</span>
                            <span lang="en" className="min-w-0 flex-1">
                                {q.question}
                            </span>
                            <span
                                lang="en"
                                className={cn("inline-flex items-center gap-1 rounded-full bg-[#ebf7f4] px-2 py-0.5 text-[12.5px] font-semibold dark:bg-primary/10", PRIMARY_TEXT)}
                            >
                                <Check className="size-3" strokeWidth={3} aria-label="Correcta:" />
                                {q.options[q.answer]}
                            </span>
                        </li>
                    ))}
                </ol>
            </div>

            <button
                type="button"
                aria-expanded={loose}
                onClick={() => setLoose((l) => !l)}
                className={cn("inline-flex min-h-10 items-center gap-1.5 text-left text-sm font-semibold", PRIMARY_TEXT)}
            >
                ¿Tu Kahoot no deja importar? Copialas de a una
                <ChevronDown className={cn("size-4 shrink-0 transition-transform", loose && "rotate-180")} />
            </button>
            {loose && (
                <div className="space-y-2.5">
                    <p className={cn("text-[13px] leading-normal", MUTED)}>
                        Tocá un texto para copiarlo y pegalo en su casillero. En cada pregunta, marcá en Kahoot la respuesta que acá tiene el tilde.
                    </p>
                    {questions.map((q, k) => (
                        <div key={k} className="space-y-2.5 rounded-lg border border-border/70 bg-card p-3.5 sm:px-4">
                            <button
                                type="button"
                                onClick={() => copy(`q${k}`, q.question)}
                                aria-label={`Copiar la pregunta ${k + 1}`}
                                className={cn(
                                    "flex w-full cursor-copy items-center gap-2.5 rounded-md px-2 py-1.5 text-left",
                                    copiedKey === `q${k}` && "bg-[#ebf7f4] dark:bg-primary/10"
                                )}
                            >
                                <span className={cn("text-[13px] font-bold", MUTED)}>{k + 1}.</span>
                                <span lang="en" className="min-w-0 flex-1 text-[15px] font-semibold">
                                    {q.question}
                                </span>
                                <CopyTag copied={copiedKey === `q${k}`} />
                            </button>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {q.options.map((option, j) => {
                                    const key = `q${k}o${j}`;
                                    const right = j === q.answer;
                                    return (
                                        <button
                                            key={j}
                                            type="button"
                                            onClick={() => copy(key, option)}
                                            aria-label={`Copiar la respuesta «${option}»${right ? ", la correcta" : ""}`}
                                            className={cn(
                                                "flex min-h-10 cursor-copy items-center gap-2 rounded-lg border py-1.5 pl-3 pr-2 text-left text-sm",
                                                right ? "border-[#bfe5da] font-semibold dark:border-primary/40" : "border-border font-medium",
                                                copiedKey === key ? "bg-[#ebf7f4] dark:bg-primary/10" : right ? "bg-[#f6fbfa] dark:bg-primary/5" : "bg-card"
                                            )}
                                        >
                                            <span lang="en" className="min-w-0 flex-1">
                                                {option}
                                            </span>
                                            {right && <Check className={cn("size-4 shrink-0", PRIMARY_TEXT)} strokeWidth={3} aria-label="Correcta" />}
                                            <CopyTag copied={copiedKey === key} />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function CopyTag({ copied }: { copied: boolean }) {
    return (
        <span
            className={cn(
                "shrink-0 rounded-full px-2 py-0.5 text-[11.5px] font-semibold",
                copied ? "bg-[#23806a] text-white" : "bg-muted text-muted-foreground"
            )}
        >
            {copied ? "Copiado" : "Copiar"}
        </span>
    );
}

/** Los pares de Wordwall o las tarjetas de Quizlet, para copiar todo de una vez. */
function PairsBox({ idea, pairs, sideClass }: { idea: PlanIdea; pairs: PlanPair[]; sideClass: string }) {
    const { copiedKey, copy } = useCopy();
    const count = pairs.length;
    const summary = idea.tool === "quizlet" ? `${count} ${count === 1 ? "tarjeta" : "tarjetas"}` : `${count} ${count === 1 ? "par" : "pares"}`;
    return (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-muted/30 py-2 pl-4 pr-2">
                <span className={cn("text-[13px]", MUTED)}>{summary}</span>
                <CopyAllButton copied={copiedKey === "todo"} label="Copiar todo" onClick={() => copy("todo", copyText(idea))} />
            </div>
            <div lang="en" className="grid grid-cols-1 gap-x-6 gap-y-1 px-4 py-3 font-mono text-[13.5px] leading-normal sm:grid-cols-2 sm:gap-y-2">
                {pairs.map((p, i) => (
                    <div key={i} className="contents">
                        <span className={cn(i > 0 && "mt-2 sm:mt-0")}>{p.left}</span>
                        <span className={sideClass}>{p.right}</span>
                    </div>
                ))}
            </div>
            <LoadSteps idea={idea} />
        </div>
    );
}

/** La lista de Wordwall para la ruleta: un elemento por renglón. */
function ListBox({ idea }: { idea: PlanIdea }) {
    const { copiedKey, copy } = useCopy();
    const count = idea.lines.length;
    return (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="flex items-center justify-between gap-3 border-b border-border/70 bg-muted/30 py-2 pl-4 pr-2">
                <span className={cn("text-[13px]", MUTED)}>
                    {count} {count === 1 ? "elemento" : "elementos"}
                </span>
                <CopyAllButton copied={copiedKey === "todo"} label="Copiar todo" onClick={() => copy("todo", copyText(idea))} />
            </div>
            <ul lang="en" className="space-y-1 px-4 py-3 font-mono text-[13.5px] leading-normal">
                {idea.lines.map((line, i) => (
                    <li key={i}>{line}</li>
                ))}
            </ul>
            <LoadSteps idea={idea} />
        </div>
    );
}

function GuideButton({ name, onClick }: { name: string; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn("inline-flex h-11 items-center gap-1.5 rounded-lg bg-primary/10 px-3 text-sm font-semibold transition-colors hover:bg-primary/15 md:h-10", PRIMARY_TEXT)}
        >
            <Compass className="size-[15px]" />
            ¿Primera vez con {name}?
        </button>
    );
}

function PracticeLink({ onClick, wide }: { onClick?: () => void; wide?: boolean }) {
    return (
        <a
            href="#practica"
            onClick={onClick}
            className={cn(
                "inline-flex items-center justify-center gap-1.5 rounded-lg bg-violet-50 font-semibold text-violet-700 transition-colors hover:bg-violet-100 dark:bg-violet-950/40 dark:text-violet-300",
                wide ? "h-12 flex-1 bg-violet-600 text-[15px] text-white hover:bg-violet-700 dark:bg-violet-600 dark:text-white" : "h-10 px-3.5 text-sm"
            )}
        >
            Ir a la práctica
            <ArrowDown className="size-[15px]" />
        </a>
    );
}

function ContentSheet({
    idea,
    momentId,
    momentName,
    onClose,
    onOpenGuide,
}: {
    idea: PlanIdea;
    momentId: MomentId;
    momentName: string;
    onClose: () => void;
    onOpenGuide: (tool: ExternalTool) => void;
}) {
    const style = MOMENT_STYLE[momentId];
    const tool = isExternalTool(idea.tool) ? TOOLS.find((t) => t.id === idea.tool) ?? null : null;
    const { copiedKey, copy } = useCopy();
    const [downloaded, setDownloaded] = useState(false);
    // Al pie va lo principal: el archivo de Kahoot o copiar todo.
    const quiz = !!idea.questions?.length;
    const label = copyLabel(idea);
    const titleId = `hoja-${momentId}`;

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        const overflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKeyDown);
        return () => {
            document.body.style.overflow = overflow;
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [onClose]);

    return createPortal(
        <div className="fixed inset-0 z-[100] bg-zinc-900/45 md:hidden">
            <button type="button" aria-label="Cerrar" onClick={onClose} className="absolute inset-x-0 top-0 h-16 w-full cursor-default" />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="absolute inset-x-0 bottom-0 top-16 flex flex-col overflow-hidden rounded-t-[20px] bg-card text-card-foreground shadow-[0_-8px_24px_rgba(0,0,0,0.12)] animate-in slide-in-from-bottom-8 duration-200"
            >
                <div className="flex shrink-0 flex-col gap-2.5 border-b border-border/70 px-4 pb-3.5 pt-2.5">
                    <span aria-hidden="true" className="h-1 w-9 self-center rounded-full bg-zinc-300 dark:bg-zinc-600" />
                    <div className="flex items-center justify-between gap-2">
                        <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold", style.tint, style.ink)}>{momentName}</span>
                        <button
                            type="button"
                            onClick={onClose}
                            autoFocus
                            aria-label="Cerrar"
                            className="flex size-10 items-center justify-center rounded-full bg-muted/70 transition-colors hover:bg-muted"
                        >
                            <X className="size-[18px]" />
                        </button>
                    </div>
                    <div className="space-y-1">
                        <h2 id={titleId} className="text-[21px] font-bold leading-tight tracking-tight">
                            {idea.title}
                        </h2>
                        <p className={cn("text-[13px]", MUTED)}>
                            {toolLabel(idea.tool)} · {ideaFacts(idea, momentId)}
                        </p>
                    </div>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
                    <ContentBody idea={idea} momentId={momentId} onOpenGuide={onOpenGuide} withActions={false} />
                </div>
                <div className="flex shrink-0 gap-2 border-t border-border/70 bg-card px-4 pb-4 pt-3">
                    {quiz && (
                        <button
                            type="button"
                            onClick={() => {
                                downloadKahoot(idea);
                                setDownloaded(true);
                            }}
                            className={cn("inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-[10px] text-[15px] font-bold", PRIMARY_BUTTON)}
                        >
                            <Download className="size-4" />
                            {downloaded ? "Descargado" : "Descargar"}
                        </button>
                    )}
                    {label && (
                        <button
                            type="button"
                            onClick={() => copy("todo", copyText(idea))}
                            className={cn("inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-[10px] text-[15px] font-bold", PRIMARY_BUTTON)}
                        >
                            {copiedKey === "todo" ? <Check className="size-4" /> : <Copy className="size-4" />}
                            {copiedKey === "todo" ? "Copiado" : label}
                        </button>
                    )}
                    {tool && tool.id !== "youglish" && (
                        <a
                            href={tool.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Abrir ${tool.name} en otra pestaña`}
                            className="inline-flex h-12 flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-border bg-card text-[15px] font-semibold"
                        >
                            Abrir {tool.name}
                            <ExternalLink className="size-[15px]" />
                        </a>
                    )}
                    {idea.tool === "campus" && <PracticeLink onClick={onClose} wide />}
                    {!quiz && !label && !(tool && tool.id !== "youglish") && idea.tool !== "campus" && (
                        <button type="button" onClick={onClose} className="h-12 flex-1 rounded-[10px] border border-border bg-card text-[15px] font-semibold">
                            Listo
                        </button>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

// ─── Plan de la clase ────────────────────────────────────────────────────────

export function PlanSummary({
    moments,
    minutes,
    whenLabel,
}: {
    moments: PlanMoments;
    /** Lo que dura la clase según el horario; `null` si no tiene horario. */
    minutes: number | null;
    whenLabel: string;
}) {
    const rows = MOMENTS.map((m) => ({ ...m, idea: selectedIdea(moments[m.id]) }));
    const inClass = rows.filter((r) => r.inClass && r.idea).reduce((sum, r) => sum + (r.idea?.minutes ?? 0), 0);
    const anyChosen = rows.some((r) => r.idea);
    const scale = Math.max(minutes ?? 0, inClass, 1);
    const free = minutes !== null ? minutes - inClass : null;

    const freeText = !anyChosen
        ? "Elegí una idea por momento y acá se suman los minutos."
        : free === null
          ? "La clase no tiene horario: no hay contra qué comparar."
          : free > 0
            ? `Te quedan ${free} minutos libres en el aula.`
            : free === 0
              ? `La clase queda justa: ${minutes} minutos.`
              : `Te pasás por ${-free} minutos. Probá una idea más corta.`;

    return (
        <section aria-labelledby="titulo-plan" className="space-y-4 rounded-xl border border-border bg-card p-4 shadow-[0_4px_16px_rgba(0,0,0,0.06)] sm:space-y-[18px] sm:p-5">
            <div className="flex items-baseline justify-between gap-2">
                <h2 id="titulo-plan" className="text-base font-bold sm:text-[17px]">
                    Plan de la clase
                </h2>
                <span className={cn("text-[12.5px]", MUTED)}>{whenLabel}</span>
            </div>
            <div className="space-y-2">
                <p className="flex items-baseline gap-1.5">
                    <span className="text-[26px] font-extrabold tabular-nums tracking-tight sm:text-3xl">{inClass}</span>
                    <span className={cn("text-[13.5px] sm:text-sm", MUTED)}>
                        {minutes !== null ? `de ${minutes} minutos en el aula` : "minutos en el aula"}
                    </span>
                </p>
                <div aria-hidden="true" className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-muted">
                    {rows
                        .filter((r) => r.inClass && r.idea)
                        .map((r) => (
                            <span key={r.id} className={cn("h-full shrink-0", MOMENT_STYLE[r.id].dot)} style={{ width: `${((r.idea?.minutes ?? 0) / scale) * 100}%` }} />
                        ))}
                </div>
                <p
                    className={cn(
                        "text-[13px] font-medium leading-normal",
                        !anyChosen || free === null ? MUTED : free < 0 ? "text-red-700 dark:text-red-400" : PRIMARY_TEXT
                    )}
                >
                    {freeText}
                </p>
            </div>
            <ol className="space-y-3 border-t border-border/70 pt-3.5 sm:space-y-3.5">
                {rows.map((r) => (
                    <li key={r.id} className="flex items-start gap-2.5">
                        <span aria-hidden="true" className={cn("mt-1 size-2.5 shrink-0 rounded-full", r.idea ? MOMENT_STYLE[r.id].dot : "border-2 border-neutral-300")} />
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                            <span className={cn("text-[11.5px] font-bold uppercase tracking-[0.06em]", MUTED)}>{r.name}</span>
                            {r.idea ? (
                                <>
                                    <span className="text-sm font-semibold leading-snug">{r.idea.title}</span>
                                    <span className={cn("text-[12.5px]", MUTED)}>
                                        {toolLabel(r.idea.tool)} · {r.idea.grouping}
                                    </span>
                                </>
                            ) : (
                                <span className={cn("text-sm italic", MUTED)}>Sin elegir</span>
                            )}
                        </span>
                        {r.idea && (
                            <span className="whitespace-nowrap text-[13px] font-semibold tabular-nums">{r.inClass ? `${r.idea.minutes} min` : "En casa"}</span>
                        )}
                    </li>
                ))}
            </ol>
            <p className={cn("flex items-center gap-2 border-t border-border/70 pt-3.5 text-[13px]", MUTED)}>
                <CloudCheck className={cn("size-4", PRIMARY_TEXT)} />
                Se guarda solo
            </p>
        </section>
    );
}
