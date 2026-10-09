"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
    AlertCircle,
    ArrowLeft,
    CalendarDays,
    Check,
    ClipboardCheck,
    Clock,
    Eye,
    Headphones,
    Loader2,
    Lock,
    MapPin,
    MessageSquare,
    Mic,
    Users,
    Wand2,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { practiceApiError } from "@/components/practice/apiError";
import { ToolGuide } from "@/app/resources/components/ResourcesView";
import { TOOLS } from "@/app/resources/tools";
import { checkDraftInputs, isScheduledPlaceholder, SCHEDULED_LESSON_TOPIC } from "@/lib/practice/draft";
import {
    campusIdea,
    countChosen,
    durationMinutes,
    emptyMoments,
    ideasBasisOf,
    MAX_WORDS,
    MOMENT_IDS,
    newIdeaId,
    selectedIdea,
    type ExternalTool,
    type MomentId,
    type PlanData,
    type PlanIdea,
    type PlanMoments,
    type PlanWord,
} from "@/lib/lessonPlan/plan";
import { cn } from "@/lib/utils";
import { saveLessonDetailsAction, saveLessonPlanAction, saveLessonPracticeAction } from "./actions";
import { MomentsSection, PlanSummary, WordsSection, type IdeasState, type OwnIdeaInput } from "./LessonPlanSections";
import { ErrorNote, FIELD, MUTED, PRIMARY_TEXT, SaveStatus, SectionHeader } from "./ui";
import { isUnsaved, useAutosave } from "./useAutosave";

const PRACTICE_FIELD =
    "w-full rounded-lg border border-violet-200 bg-background px-3.5 py-2.5 text-base leading-relaxed text-foreground outline-none transition-colors placeholder:text-neutral-400 focus:border-violet-400 focus:ring-2 focus:ring-violet-500/20 disabled:cursor-not-allowed disabled:opacity-70 dark:border-violet-900/60 sm:text-sm";

const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

type Schedule = { id: string; dayOfWeek: number; startTime: string; endTime: string; room: string | null };

type Props = {
    courseId: string;
    lessonId: string;
    canWrite: boolean;
    courseFinished: boolean;
    course: {
        name: string;
        level: string | null;
        teacherName: string | null;
        classroomName: string | null;
        studentCount: number;
        schedules: Schedule[];
    };
    lesson: { topic: string; content: string; dateKey: string; scheduleId: string | null };
    practice: { speakingPhrases: string; listeningText: string; chatScenario: string; isPublished: boolean } | null;
    plan: PlanData;
};

type AiBusy = "words" | "ideas" | MomentId | null;

export function LessonPageView({ courseId, lessonId, canWrite, courseFinished, course, lesson, practice, plan }: Props) {
    const router = useRouter();

    // ── 1. La clase ───────────────────────────────────────────────────────────
    // Una clase generada desde el horario nace con «Clase Programada» de tema:
    // acá se muestra vacía, y vacía se vuelve a guardar con ese rótulo.
    const [topic, setTopic] = useState(isScheduledPlaceholder(lesson.topic) ? "" : lesson.topic);
    const [content, setContent] = useState(lesson.content);
    const [dateKey, setDateKey] = useState(lesson.dateKey);
    const [scheduleId, setScheduleId] = useState(lesson.scheduleId ?? "");
    const [editingWhen, setEditingWhen] = useState(false);

    const details = useMemo(
        () => ({ topic: topic.trim() || SCHEDULED_LESSON_TOPIC, content, date: dateKey, scheduleId: scheduleId || null }),
        [topic, content, dateKey, scheduleId]
    );
    const saveDetails = useCallback(
        async (value: typeof details) => {
            const res = await saveLessonDetailsAction({ lessonId, courseId, ...value });
            return res.success ? null : res.error;
        },
        [lessonId, courseId]
    );
    const detailsSave = useAutosave(details, saveDetails, canWrite);
    const readiness = checkDraftInputs(topic || SCHEDULED_LESSON_TOPIC, content);

    // ── 2 y 3. Las palabras y el armado ──────────────────────────────────────
    const [focus, setFocus] = useState(plan.focus);
    const [words, setWords] = useState<PlanWord[]>(plan.words);
    const [moments, setMoments] = useState<PlanMoments | null>(plan.moments);
    const [ideasBasis, setIdeasBasis] = useState(plan.ideasBasis);

    const planValue = useMemo<PlanData>(() => ({ focus, words, moments, ideasBasis }), [focus, words, moments, ideasBasis]);
    const savePlan = useCallback(
        async (value: PlanData) => {
            const res = await saveLessonPlanAction({ lessonId, courseId, plan: value });
            return res.success ? null : res.error;
        },
        [lessonId, courseId]
    );
    const planSave = useAutosave(planValue, savePlan, canWrite);

    const [aiBusy, setAiBusy] = useState<AiBusy>(null);
    const [wordsError, setWordsError] = useState<string | null>(null);
    const [momentErrors, setMomentErrors] = useState<Partial<Record<MomentId, string>>>({});
    const [confirmIdeas, setConfirmIdeas] = useState(false);
    const [guideTool, setGuideTool] = useState<ExternalTool | null>(null);

    const chosenWords = words.filter((w) => w.on).length;
    const chosenMoments = countChosen(moments);
    const hasAiIdeas = moments !== null && MOMENT_IDS.some((id) => moments[id].ideas.some((i) => !i.own && i.tool !== "campus"));
    const ideasState: IdeasState = !hasAiIdeas ? "none" : ideasBasis === ideasBasisOf(focus, words) ? "fresh" : "stale";

    const planBlocked = readiness.ready
        ? null
        : readiness.missing === "topic"
          ? "Para que la IA sugiera palabras e ideas, primero poné el tema de la clase."
          : "Para que la IA sugiera palabras e ideas, contá en Contenidos qué se da en la clase: es lo que lee.";
    const askBlocked = planBlocked ?? (chosenWords === 0 ? "Elegí al menos una palabra de la clase para pedir ideas." : null);

    // El servidor arma los pedidos con lo guardado: primero se guarda lo pendiente.
    const saveBeforeAsking = async () => {
        const [savedDetails, savedPlan] = await Promise.all([detailsSave.flush(), planSave.flush()]);
        return savedDetails && savedPlan;
    };
    const notSaved = "No se pudo guardar la clase, así que la IA no tiene de dónde partir. Revisá el aviso de arriba.";

    const askPlan = async (path: "words" | "ideas", body: Record<string, unknown>) =>
        fetch(`/api/lesson-plan/${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lessonId, courseId, ...body }),
        });

    const suggestWords = async () => {
        if (aiBusy || planBlocked) return;
        setAiBusy("words");
        setWordsError(null);
        try {
            if (!(await saveBeforeAsking())) return setWordsError(notSaved);
            const res = await askPlan("words", {});
            if (!res.ok) return setWordsError(await planApiError(res, "No pudimos sugerir las palabras. Probá de nuevo en un momento."));
            const data = (await res.json()) as { words: string[] };
            // Se quedan las tildadas y las propias; las destildadas dejan lugar.
            setWords((current) => {
                const keep = current.filter((w) => w.on || w.own);
                const taken = new Set(keep.map((w) => w.text.toLowerCase()));
                const fresh = data.words.filter((text) => !taken.has(text.toLowerCase())).map((text) => ({ text, on: true }));
                return [...keep, ...fresh].slice(0, MAX_WORDS);
            });
        } catch {
            setWordsError("No pudimos sugerir las palabras. Probá de nuevo en un momento.");
        } finally {
            setAiBusy(null);
        }
    };

    const proposeIdeas = async (confirmed: boolean) => {
        if (aiBusy || askBlocked) return;
        const hasChoices = moments !== null && MOMENT_IDS.some((id) => {
            const idea = selectedIdea(moments[id]);
            return idea !== null && !idea.own;
        });
        if (hasChoices && !confirmed) return setConfirmIdeas(true);

        setConfirmIdeas(false);
        setAiBusy("ideas");
        setWordsError(null);
        setMomentErrors({});
        const basis = ideasBasisOf(focus, words);
        try {
            if (!(await saveBeforeAsking())) return setWordsError(notSaved);
            const res = await askPlan("ideas", {});
            if (!res.ok) return setWordsError(await planApiError(res, "No pudimos escribir las ideas. Probá de nuevo en un momento."));
            const data = (await res.json()) as { moments: Partial<Record<MomentId, PlanIdea[]>> };
            // Las ideas que escribió el docente se quedan, y si había elegido una
            // de ésas, sigue elegida.
            setMoments((current) => {
                const next = emptyMoments();
                for (const id of MOMENT_IDS) {
                    const own = current?.[id].ideas.filter((i) => i.own) ?? [];
                    const chosen = current ? selectedIdea(current[id]) : null;
                    next[id] = { ideas: [...(data.moments[id] ?? []), ...own], selectedId: chosen?.own ? chosen.id : null };
                }
                return next;
            });
            setIdeasBasis(basis);
            document.getElementById("armar")?.scrollIntoView({ behavior: "smooth", block: "start" });
        } catch {
            setWordsError("No pudimos escribir las ideas. Probá de nuevo en un momento.");
        } finally {
            setAiBusy(null);
        }
    };

    const moreIdeas = async (id: MomentId) => {
        if (aiBusy || askBlocked) return;
        setAiBusy(id);
        setMomentErrors((errors) => ({ ...errors, [id]: undefined }));
        const basis = ideasBasisOf(focus, words);
        const fail = (message: string) => setMomentErrors((errors) => ({ ...errors, [id]: message }));
        try {
            if (!(await saveBeforeAsking())) return fail(notSaved);
            const res = await askPlan("ideas", { moment: id });
            if (!res.ok) return fail(await planApiError(res, "No pudimos traer otras ideas. Probá de nuevo en un momento."));
            const data = (await res.json()) as { moments: Partial<Record<MomentId, PlanIdea[]>> };
            const fresh = data.moments[id] ?? [];
            // La elegida, la propia y la práctica del campus se quedan; las otras
            // se cambian por las nuevas.
            setMoments((current) => {
                const base = current ?? emptyMoments();
                const moment = base[id];
                const chosen = selectedIdea(moment);
                const kept = moment.ideas.filter((i) => i.own || i.tool === "campus" || i.id === chosen?.id);
                const keptAi = kept.filter((i) => !i.own && i.tool !== "campus");
                const room = Math.max(1, (id === "tarea" ? 2 : 3) - keptAi.length);
                const hasMaterial = kept.some((i) => i.tool === "material");
                const incoming = fresh.filter((i) => !(hasMaterial && i.tool === "material")).slice(0, room);
                const ideas = [...kept.filter((i) => !i.own), ...incoming, ...kept.filter((i) => i.own)];
                return { ...base, [id]: { ideas, selectedId: moment.selectedId } };
            });
            setIdeasBasis((current) => current ?? basis);
        } catch {
            fail("No pudimos traer otras ideas. Probá de nuevo en un momento.");
        } finally {
            setAiBusy(null);
        }
    };

    const pickIdea = (id: MomentId, ideaId: string) =>
        setMoments((current) => {
            if (!current) return current;
            const moment = current[id];
            return { ...current, [id]: { ...moment, selectedId: moment.selectedId === ideaId ? null : ideaId } };
        });

    const saveOwnIdea = (id: MomentId, input: OwnIdeaInput | null) =>
        setMoments((current) => {
            const base = current ?? emptyMoments();
            const moment = base[id];
            const existing = moment.ideas.find((i) => i.own) ?? null;
            if (!input) {
                return {
                    ...base,
                    [id]: {
                        ideas: moment.ideas.filter((i) => !i.own),
                        selectedId: moment.selectedId === existing?.id ? null : moment.selectedId,
                    },
                };
            }
            const idea: PlanIdea = {
                id: existing?.id ?? newIdeaId(),
                title: input.title,
                description: input.description,
                tool: "none",
                minutes: input.minutes,
                grouping: existing?.grouping ?? (id === "tarea" ? "Cada uno" : "Toda la clase"),
                lines: input.lines,
                own: true,
            };
            const ideas = existing ? moment.ideas.map((i) => (i.own ? idea : i)) : [...moment.ideas, idea];
            return { ...base, [id]: { ideas, selectedId: idea.id } };
        });

    const startManual = () => setMoments({ ...emptyMoments(), tarea: { ideas: [campusIdea()], selectedId: null } });

    // El `Dialog` compartido cierra con el fondo pero no con Escape.
    useEffect(() => {
        if (!guideTool) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setGuideTool(null);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [guideTool]);
    const openGuide = TOOLS.find((tool) => tool.id === guideTool) ?? null;

    // ── 4. La práctica ────────────────────────────────────────────────────────
    const [phrases, setPhrases] = useState(practice?.speakingPhrases ?? "");
    const [listening, setListening] = useState(practice?.listeningText ?? "");
    const [chat, setChat] = useState(practice?.chatScenario ?? "");
    const [published, setPublished] = useState(practice?.isPublished ?? false);

    const hasPhrases = phrases.trim().length > 0;
    const hasPracticeContent = hasPhrases || listening.trim().length > 0 || chat.trim().length > 0;

    // Sin frases no se puede publicar: si el docente las borra todas, la
    // práctica vuelve a borrador acá también y no sólo en el servidor.
    useEffect(() => {
        if (!hasPhrases && published) setPublished(false);
    }, [hasPhrases, published]);

    const practiceValue = useMemo(
        () => ({ speakingPhrases: phrases, listeningText: listening, chatScenario: chat, isPublished: published }),
        [phrases, listening, chat, published]
    );
    const savePractice = useCallback(
        async (value: typeof practiceValue) => {
            const res = await saveLessonPracticeAction({ lessonId, courseId, ...value });
            if (!res.success) return res.error;
            if (res.isPublished !== value.isPublished) setPublished(res.isPublished);
            return null;
        },
        [lessonId, courseId]
    );
    const practiceSave = useAutosave(practiceValue, savePractice, canWrite);

    const [generation, setGeneration] = useState<"idle" | "confirm" | "generating">("idle");
    const [generateError, setGenerateError] = useState<string | null>(null);
    const [justGenerated, setJustGenerated] = useState(false);

    const generate = async () => {
        if (!readiness.ready || generation === "generating") return;
        if (hasPracticeContent && generation !== "confirm") {
            setGeneration("confirm");
            return;
        }

        setGeneration("generating");
        setGenerateError(null);
        setJustGenerated(false);

        // El servidor redacta a partir de la clase guardada —el tema, los
        // contenidos y las palabras—: primero se guarda lo pendiente.
        if (!(await saveBeforeAsking())) {
            setGenerateError(notSaved);
            setGeneration("idle");
            return;
        }

        try {
            const res = await fetch("/api/practice/generate-draft", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lessonId }),
            });
            if (!res.ok) {
                const detail = res.status === 409 ? (await res.text().catch(() => "")).trim() : "";
                setGenerateError(detail || (await practiceApiError(res, "No pudimos generar la práctica. Probá de nuevo en un momento.")));
                return;
            }
            const draft = await res.json();
            setPhrases(Array.isArray(draft.speakingPhrases) ? draft.speakingPhrases.join("\n") : "");
            setListening(draft.listeningText ?? "");
            setChat(draft.chatScenario ?? "");
            // Lo que escribe la IA lo revisa el docente antes de que lo vean los
            // alumnos: vuelve a borrador aunque la anterior estuviera publicada.
            setPublished(false);
            setJustGenerated(true);
        } catch {
            setGenerateError("No pudimos generar la práctica. Probá de nuevo en un momento.");
        } finally {
            setGeneration("idle");
        }
    };

    const openPreview = async () => {
        await practiceSave.flush();
        router.push(`/courses/${courseId}/lessons/${lessonId}/practice-preview`);
    };

    // Avisa antes de irse con algo sin guardar. Con medio segundo de espera es
    // raro, pero cerrar la pestaña justo después de escribir pasa.
    const unsaved = [detailsSave, planSave, practiceSave].some((s) => isUnsaved(s.state));
    useEffect(() => {
        if (!unsaved) return;
        const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
        window.addEventListener("beforeunload", onBeforeUnload);
        return () => window.removeEventListener("beforeunload", onBeforeUnload);
    }, [unsaved]);

    // ── Lo que se muestra arriba ─────────────────────────────────────────────
    const schedule = course.schedules.find((s) => s.id === scheduleId) ?? null;
    const lessonDate = new Date(`${dateKey}T12:00:00`);
    const dateLabel = format(lessonDate, "EEEE d 'de' MMMM", { locale: es });
    const room = schedule?.room ?? course.classroomName;
    const minutes = schedule ? durationMinutes(schedule.startTime, schedule.endTime) : null;
    const hasTopic = topic.trim().length > 0;
    const whenLabel = `${capitalize(format(lessonDate, "EEE d/M", { locale: es }))}${schedule ? ` · ${schedule.startTime}` : ""}`;

    const parts = [
        { href: "#la-clase", n: 1, label: "La clase", status: hasTopic ? "Lista" : "Falta el tema", done: hasTopic },
        { href: "#palabras", n: 2, label: "Palabras", status: chosenWords ? `${chosenWords} elegidas` : "Sin palabras", done: chosenWords > 0 },
        {
            href: "#armar",
            n: 3,
            label: "Armar la clase",
            status: chosenMoments ? `${chosenMoments} de ${MOMENT_IDS.length} momentos` : "Sin armar",
            done: chosenMoments === MOMENT_IDS.length,
        },
        { href: "#practica", n: 4, label: "Práctica", status: published ? "Publicada" : hasPracticeContent ? "Borrador" : "Sin armar", done: published },
    ];

    const whoSees = (
        <div className="flex gap-3 rounded-xl bg-muted/40 p-4">
            <Lock className={cn("mt-0.5 size-[18px] shrink-0", MUTED)} />
            <div className="space-y-1">
                <h2 className="text-sm font-bold">Quién ve esta clase</h2>
                <p className={cn("text-[13px] leading-normal", MUTED)}>
                    El docente del curso y la administración del instituto. Los alumnos ven sólo la práctica, cuando se
                    publica.
                </p>
            </div>
        </div>
    );

    return (
        <main className="container mx-auto px-4 py-6 animate-in fade-in slide-in-from-bottom-4 duration-500 sm:px-6 md:py-8">
            <div className="flex flex-col gap-6 md:gap-7">
                <nav aria-label="Ruta" className={cn("flex flex-wrap items-center gap-2 text-sm", MUTED)}>
                    <Link href="/courses" className="hidden items-center gap-1.5 font-medium hover:text-foreground sm:inline-flex">
                        <ArrowLeft className="size-4" />
                        Cursos
                    </Link>
                    <span aria-hidden="true" className="hidden sm:inline">/</span>
                    <Link href={`/courses/${courseId}`} className="inline-flex items-center gap-1.5 font-medium hover:text-foreground">
                        <ArrowLeft className="size-4 sm:hidden" />
                        {course.name}
                    </Link>
                    <span aria-hidden="true" className="hidden sm:inline">/</span>
                    <span aria-current="page" className="hidden font-semibold text-foreground sm:inline">
                        Clase del {dateLabel}
                    </span>
                </nav>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
                    <div className="min-w-0 space-y-3">
                        <span className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1.5 text-[13px] font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
                            <CalendarDays className="size-4" />
                            Clase
                        </span>
                        <h1
                            className={cn(
                                "text-[26px] font-extrabold leading-tight tracking-tight [text-wrap:balance] sm:text-4xl",
                                hasTopic ? "text-foreground/90" : MUTED
                            )}
                        >
                            {hasTopic ? topic : "Clase sin tema todavía"}
                        </h1>
                        <div className={cn("flex flex-wrap gap-x-5 gap-y-1.5 text-sm", MUTED)}>
                            <span className="inline-flex items-center gap-1.5">
                                <CalendarDays className="size-4" />
                                {capitalize(dateLabel)}
                            </span>
                            {schedule && (
                                <span className="inline-flex items-center gap-1.5">
                                    <Clock className="size-4" />
                                    {schedule.startTime} a {schedule.endTime}
                                    {minutes ? ` · ${minutes} minutos` : ""}
                                </span>
                            )}
                            {room && (
                                <span className="inline-flex items-center gap-1.5">
                                    <MapPin className="size-4" />
                                    {room}
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1.5">
                                <Users className="size-4" />
                                {course.studentCount} {course.studentCount === 1 ? "alumno" : "alumnos"}
                            </span>
                        </div>
                    </div>
                    <Link
                        href={`/courses/${courseId}/lessons/${lessonId}/attendance`}
                        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-4 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-500/15 dark:text-emerald-400"
                    >
                        <ClipboardCheck className="size-[18px]" />
                        {courseFinished ? "Ver asistencia" : "Asistencia"}
                    </Link>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <nav aria-label="Partes de la clase" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
                        {parts.map((part) => (
                            <a
                                key={part.href}
                                href={part.href}
                                className="inline-flex h-11 shrink-0 items-center gap-2.5 rounded-full border border-border bg-card pl-2 pr-4 text-sm text-foreground shadow-xs transition-colors hover:bg-muted/40"
                            >
                                <span
                                    className={cn(
                                        "flex size-7 items-center justify-center rounded-full text-[13px] font-bold",
                                        part.done ? "bg-[#23806a] text-white" : "bg-muted/70 text-foreground"
                                    )}
                                >
                                    {part.done ? <Check className="size-3.5" strokeWidth={3} /> : part.n}
                                </span>
                                <span className="whitespace-nowrap font-semibold">{part.label}</span>
                                <span className={cn("hidden whitespace-nowrap sm:inline", MUTED)}>{part.status}</span>
                            </a>
                        ))}
                    </nav>
                    {canWrite && <SaveStatus states={[detailsSave, planSave, practiceSave]} />}
                </div>

                {!canWrite && (
                    <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/30 p-4 text-sm">
                        <Lock className={cn("mt-0.5 size-4 shrink-0", MUTED)} />
                        <p className={MUTED}>
                            {courseFinished
                                ? "El curso está finalizado: la clase se puede leer, pero ya no se cambia."
                                : "Esta clase es sólo de lectura para vos."}
                        </p>
                    </div>
                )}

                <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10 xl:grid-cols-[minmax(0,1fr)_336px]">
                    <div className="flex min-w-0 flex-col gap-10 md:gap-12">
                        <section id="la-clase" aria-labelledby="titulo-la-clase" className="scroll-mt-24 space-y-4">
                            <SectionHeader
                                n={1}
                                titleId="titulo-la-clase"
                                title="La clase"
                                description="Lo que queda en el libro de temas. El tema es lo que ven los alumnos y las familias."
                            />
                            <Card className="space-y-5 p-4 sm:p-6">
                                <div className="space-y-1.5">
                                    <label htmlFor="tema" className="text-[13px] font-semibold">
                                        Tema
                                    </label>
                                    <input
                                        id="tema"
                                        type="text"
                                        value={topic}
                                        onChange={(e) => setTopic(e.target.value)}
                                        disabled={!canWrite}
                                        maxLength={200}
                                        placeholder="Ej: Past simple para contar el fin de semana"
                                        className={cn(FIELD, "h-11")}
                                    />
                                    {!hasTopic && (
                                        <p className={cn("text-[12.5px] leading-normal", MUTED)}>
                                            Mientras no tenga tema, en el libro de temas figura como «{SCHEDULED_LESSON_TOPIC}».
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <label htmlFor="contenidos" className="text-[13px] font-semibold">
                                        Contenidos
                                    </label>
                                    <textarea
                                        id="contenidos"
                                        rows={4}
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        disabled={!canWrite}
                                        placeholder="Unidad, páginas del libro, puntos de gramática, tareas…"
                                        className={cn(FIELD, "resize-y py-2.5 leading-relaxed")}
                                    />
                                    <p className={cn("text-[12.5px] leading-normal", MUTED)}>
                                        Cuanto más concreto, mejores salen las palabras y las ideas de abajo.
                                    </p>
                                </div>

                                <div className="border-t border-border/70 pt-4">
                                    {editingWhen ? (
                                        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                                            <div className="space-y-1.5 sm:w-48">
                                                <label htmlFor="fecha" className="text-[13px] font-semibold">
                                                    Fecha
                                                </label>
                                                <input
                                                    id="fecha"
                                                    type="date"
                                                    value={dateKey}
                                                    onChange={(e) => e.target.value && setDateKey(e.target.value)}
                                                    className={cn(FIELD, "h-11")}
                                                />
                                            </div>
                                            <div className="min-w-0 flex-1 space-y-1.5">
                                                <label htmlFor="horario" className="text-[13px] font-semibold">
                                                    Horario
                                                </label>
                                                <select
                                                    id="horario"
                                                    value={scheduleId}
                                                    onChange={(e) => setScheduleId(e.target.value)}
                                                    className={cn(FIELD, "h-11")}
                                                >
                                                    <option value="">Sin horario</option>
                                                    {course.schedules.map((s) => (
                                                        <option key={s.id} value={s.id}>
                                                            {scheduleLabel(s)}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setEditingWhen(false)}
                                                className="h-11 rounded-lg border border-border bg-card px-4 text-sm font-semibold transition-colors hover:bg-muted/40"
                                            >
                                                Listo
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                                            <span>
                                                <strong className="font-semibold">Fecha</strong>{" "}
                                                <span className={MUTED}>{dateLabel}</span>
                                            </span>
                                            {schedule ? (
                                                <span>
                                                    <strong className="font-semibold">Horario</strong>{" "}
                                                    <span className={MUTED}>
                                                        {schedule.startTime} a {schedule.endTime}
                                                    </span>
                                                </span>
                                            ) : (
                                                <span className={MUTED}>Sin horario asignado</span>
                                            )}
                                            {room && (
                                                <span>
                                                    <strong className="font-semibold">Aula</strong> <span className={MUTED}>{room}</span>
                                                </span>
                                            )}
                                            {canWrite && (
                                                <button
                                                    type="button"
                                                    onClick={() => setEditingWhen(true)}
                                                    className={cn(
                                                        "h-10 rounded-lg px-2 text-sm font-semibold transition-colors hover:bg-primary/10 sm:ml-auto",
                                                        PRIMARY_TEXT
                                                    )}
                                                >
                                                    Cambiar fecha u horario
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {detailsSave.error && <ErrorNote>{detailsSave.error}</ErrorNote>}
                            </Card>
                        </section>

                        <WordsSection
                            canWrite={canWrite}
                            focus={focus}
                            onFocusChange={setFocus}
                            words={words}
                            onWordsChange={setWords}
                            blocked={planBlocked}
                            busy={aiBusy}
                            onSuggest={suggestWords}
                            onPropose={() => proposeIdeas(false)}
                            ideasState={ideasState}
                            error={wordsError ?? planSave.error}
                            confirming={confirmIdeas}
                            onConfirm={() => proposeIdeas(true)}
                            onCancelConfirm={() => setConfirmIdeas(false)}
                        />

                        <MomentsSection
                            canWrite={canWrite}
                            moments={moments}
                            studentCount={course.studentCount}
                            level={course.level}
                            busy={aiBusy}
                            errors={momentErrors}
                            askBlocked={askBlocked}
                            onPick={pickIdea}
                            onMore={moreIdeas}
                            onSaveOwn={saveOwnIdea}
                            onStartManual={startManual}
                            onOpenGuide={setGuideTool}
                        />

                        <section id="practica" aria-labelledby="titulo-practica" className="scroll-mt-24 space-y-4">
                            <SectionHeader
                                n={4}
                                tone="violet"
                                titleId="titulo-practica"
                                title="La práctica de los alumnos"
                                description={
                                    chosenWords > 0
                                        ? "Es la tarea de esta clase. La hacen desde su cuenta del campus, con las palabras de hoy."
                                        : "Es la tarea de esta clase. La hacen desde su cuenta del campus, con lo que se dio hoy."
                                }
                            />
                            <Card className="space-y-5 border-violet-200 p-4 dark:border-violet-900/50 sm:p-6">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <PracticeChip published={published} hasContent={hasPracticeContent} />
                                    <div className="flex flex-wrap gap-2">
                                        {canWrite && (
                                            <button
                                                type="button"
                                                onClick={generate}
                                                disabled={!readiness.ready || generation === "generating"}
                                                className="inline-flex h-10 items-center gap-2 rounded-lg border border-violet-300 bg-card px-3.5 text-sm font-semibold text-violet-700 transition-colors hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-violet-800 dark:text-violet-300 dark:hover:bg-violet-950/40"
                                            >
                                                {generation === "generating" ? (
                                                    <Loader2 className="size-4 animate-spin" />
                                                ) : (
                                                    <Wand2 className="size-4" />
                                                )}
                                                {generation === "generating"
                                                    ? "Escribiendo…"
                                                    : `${hasPracticeContent ? "Rehacer" : "Escribir"} ${chosenWords > 0 ? "con las palabras de la clase" : "con la IA"}`}
                                            </button>
                                        )}
                                        {hasPhrases && (
                                            <button
                                                type="button"
                                                onClick={openPreview}
                                                className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-card px-3.5 text-sm font-medium transition-colors hover:bg-muted/40"
                                            >
                                                <Eye className="size-4" />
                                                Ver como alumno
                                            </button>
                                        )}
                                    </div>
                                </div>

                                {canWrite && !readiness.ready && !hasPracticeContent && (
                                    <p className={cn("flex items-start gap-2 rounded-lg bg-muted/40 p-3 text-[13.5px] leading-normal", MUTED)}>
                                        <AlertCircle className="mt-0.5 size-4 shrink-0" />
                                        {readiness.missing === "topic"
                                            ? "Para que la IA la escriba, primero poné el tema de la clase."
                                            : "Para que la IA la escriba, contá en Contenidos qué se da en la clase: es lo que lee para armarla."}
                                    </p>
                                )}

                                {generation === "confirm" && (
                                    <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-3.5 dark:border-amber-800/50 dark:bg-amber-950/30">
                                        <p className="text-sm leading-normal text-amber-900 dark:text-amber-200">
                                            La IA reemplaza las frases, el texto y la conversación de abajo.
                                            {published && " La práctica vuelve a borrador hasta que la revises y la publiques de nuevo."}
                                        </p>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={generate}
                                                className="h-10 rounded-lg bg-violet-600 px-4 text-sm font-semibold text-white transition-colors hover:bg-violet-700"
                                            >
                                                Reemplazar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setGeneration("idle")}
                                                className="h-10 rounded-lg px-4 text-sm font-semibold transition-colors hover:bg-amber-100 dark:hover:bg-amber-900/40"
                                            >
                                                Cancelar
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {generateError && <ErrorNote>{generateError}</ErrorNote>}
                                {justGenerated && !generateError && (
                                    <p className="flex items-start gap-2 rounded-lg bg-violet-500/10 p-3 text-[13.5px] leading-normal text-violet-800 dark:text-violet-200">
                                        <Wand2 className="mt-0.5 size-4 shrink-0" />
                                        Listo. Revisá lo que escribió la IA y corregí lo que haga falta: queda como borrador hasta que la publiques.
                                    </p>
                                )}

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <PracticeField
                                        id="frases"
                                        Icon={Mic}
                                        label="Frases para pronunciar"
                                        hint="Una frase por línea."
                                        rows={7}
                                        value={phrases}
                                        onChange={setPhrases}
                                        disabled={!canWrite || generation === "generating"}
                                        placeholder={"I went to the cinema with my cousins.\nDid you watch the match last night?"}
                                    />
                                    <PracticeField
                                        id="texto"
                                        Icon={Headphones}
                                        label="Texto para escuchar"
                                        hint="Se convierte en audio. Las preguntas aparecen antes de escuchar."
                                        rows={7}
                                        value={listening}
                                        onChange={setListening}
                                        disabled={!canWrite || generation === "generating"}
                                        placeholder="Un párrafo corto en inglés, con lo que se dio en la clase."
                                    />
                                </div>
                                <PracticeField
                                    id="chat"
                                    Icon={MessageSquare}
                                    label="Conversación con el chat"
                                    hint="Quién es el chat, en qué situación y para qué nivel."
                                    rows={3}
                                    value={chat}
                                    onChange={setChat}
                                    disabled={!canWrite || generation === "generating"}
                                    placeholder="Ej: Sos un mozo en un café. El alumno es un turista que pide el desayuno. Nivel B1."
                                />

                                <PublishSwitch
                                    published={published}
                                    hasContent={hasPracticeContent}
                                    canPublish={hasPhrases}
                                    disabled={!canWrite || generation === "generating"}
                                    onChange={setPublished}
                                />
                                {practiceSave.error && <ErrorNote>{practiceSave.error}</ErrorNote>}
                            </Card>
                        </section>

                        <div className="lg:hidden">{whoSees}</div>
                    </div>

                    {/* En el celular, el plan va arriba de todo, como en el lienzo. */}
                    <aside aria-label="Sobre esta clase" className="order-first flex flex-col gap-4 lg:sticky lg:top-24 lg:order-none lg:self-start">
                        {(moments !== null || aiBusy === "ideas") && (
                            <PlanSummary moments={moments ?? emptyMoments()} minutes={minutes} whenLabel={whenLabel} />
                        )}
                        <div className="hidden lg:block">{whoSees}</div>
                    </aside>
                </div>
            </div>

            <Dialog open={openGuide !== null} onOpenChange={(open) => { if (!open) setGuideTool(null); }}>
                {openGuide && (
                    <DialogContent className="flex max-h-[calc(100dvh-2rem)] max-w-2xl flex-col overflow-hidden p-0">
                        <ToolGuide tool={openGuide} onClose={() => setGuideTool(null)} />
                    </DialogContent>
                )}
            </Dialog>
        </main>
    );
}

/**
 * El mensaje de los pedidos del armado. Los del servidor —sin permiso, falta el
 * tema, se terminó la cuota— están escritos para el docente y se muestran tal
 * cual; una falla que no sea de esas lleva el mensaje de la pantalla.
 */
async function planApiError(res: Response, fallback: string): Promise<string> {
    const readable = [403, 404, 409, 429].includes(res.status) || (res.status === 500 && (res.headers.get("content-type") ?? "").startsWith("text/plain"));
    if (!readable) return fallback;
    const message = await res.text().catch(() => "");
    return message.trim() || fallback;
}

// ─── Piezas de la práctica ───────────────────────────────────────────────────

function PracticeChip({ published, hasContent }: { published: boolean; hasContent: boolean }) {
    if (published) {
        return (
            <span className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-[12.5px] font-bold text-violet-700 dark:border-violet-800/60 dark:bg-violet-950/40 dark:text-violet-300">
                Publicada
            </span>
        );
    }
    return (
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[12.5px] font-bold text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-400">
            {hasContent ? "Borrador" : "Sin armar"}
        </span>
    );
}

function PracticeField({
    id,
    Icon,
    label,
    hint,
    rows,
    value,
    onChange,
    disabled,
    placeholder,
}: {
    id: string;
    Icon: typeof Mic;
    label: string;
    hint: string;
    rows: number;
    value: string;
    onChange: (value: string) => void;
    disabled: boolean;
    placeholder: string;
}) {
    return (
        <div className="space-y-2">
            <label htmlFor={id} className="inline-flex items-center gap-2 text-sm font-semibold text-violet-700 dark:text-violet-300">
                <Icon className="size-4" />
                {label}
            </label>
            <textarea
                id={id}
                rows={rows}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                placeholder={placeholder}
                className={cn(PRACTICE_FIELD, "resize-y")}
            />
            <p className={cn("text-[12.5px] leading-normal", MUTED)}>{hint}</p>
        </div>
    );
}

function PublishSwitch({
    published,
    hasContent,
    canPublish,
    disabled,
    onChange,
}: {
    published: boolean;
    hasContent: boolean;
    canPublish: boolean;
    disabled: boolean;
    onChange: (value: boolean) => void;
}) {
    const off = disabled || (!published && !canPublish);
    return (
        <button
            type="button"
            role="switch"
            aria-checked={published}
            onClick={() => onChange(!published)}
            disabled={off}
            className={cn(
                "flex w-full items-center gap-3.5 rounded-lg border p-3.5 text-left transition-colors disabled:cursor-not-allowed",
                published
                    ? "border-violet-300 bg-violet-50 dark:border-violet-800 dark:bg-violet-950/40"
                    : "border-border bg-card hover:bg-muted/30 disabled:hover:bg-card"
            )}
        >
            <span
                aria-hidden="true"
                className={cn(
                    "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                    published ? "bg-violet-600" : "bg-neutral-300 dark:bg-neutral-700",
                    off && !published && "opacity-60"
                )}
            >
                <span
                    className={cn(
                        "absolute top-[3px] size-[18px] rounded-full bg-white shadow-sm transition-[left]",
                        published ? "left-[23px]" : "left-[3px]"
                    )}
                />
            </span>
            <span className="space-y-0.5">
                <span className="block text-[14.5px] font-semibold">
                    {published ? "Visible para los alumnos" : hasContent ? "Guardada como borrador" : "Sin publicar"}
                </span>
                <span className={cn("block text-[13px] leading-normal", MUTED)}>
                    {published
                        ? "Les aparece en su campus como tarea de esta clase."
                        : canPublish
                          ? "Los alumnos todavía no la ven. Publicala cuando esté lista."
                          : "Para publicarla hace falta al menos una frase para pronunciar."}
                </span>
            </span>
        </button>
    );
}

// ─── Ayudas ──────────────────────────────────────────────────────────────────

function scheduleLabel(s: Schedule) {
    return `${DAYS[s.dayOfWeek]} ${s.startTime} – ${s.endTime}${s.room ? ` (${s.room})` : ""}`;
}

function capitalize(text: string) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}
