"use client";

import { Sparkles, Mic2, Users, TrendingUp, AlertCircle, CheckCircle2, TrendingDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { format, addHours } from "date-fns";
import { es } from "date-fns/locale";

// ─── Types ────────────────────────────────────────────────────────────────────

interface LessonPracticeStats {
    lessonId: string;
    lessonTopic: string;
    lessonDate: string;
    sessionCount: number;       // Total sessions (can be > student count if students repeated)
    studentCount: number;       // Unique students who practiced
    avgAccuracy: number | null;
}

interface CoursePracticeMetricsProps {
    totalEnrolled: number;
    byLesson: LessonPracticeStats[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CoursePracticeMetrics({ totalEnrolled, byLesson }: CoursePracticeMetricsProps) {
    if (byLesson.length === 0) {
        return (
            <Card className="p-6 rounded-xl border-violet-200/50 dark:border-violet-800/50 bg-violet-50/30 dark:bg-violet-950/10">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                        <Sparkles size={14} className="text-violet-500" />
                    </div>
                    <h3 className="font-bold text-sm">Práctica con IA</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                    No hay prácticas publicadas en este curso todavía. Al cargar material en una clase y publicarlo, aparecerán las métricas de uso acá.
                </p>
            </Card>
        );
    }

    // Aggregate totals
    const allStudentsThatPracticed = new Set(byLesson.flatMap(l => Array(l.studentCount).fill(null))).size;
    const totalSessions = byLesson.reduce((s, l) => s + l.sessionCount, 0);
    const withAccuracy = byLesson.filter(l => l.avgAccuracy !== null);
    const overallAvg = withAccuracy.length > 0
        ? Math.round(withAccuracy.reduce((s, l) => s + (l.avgAccuracy ?? 0), 0) / withAccuracy.length)
        : null;

    // Find hardest lesson (lowest avg accuracy)
    const sorted = [...byLesson].filter(l => l.avgAccuracy !== null).sort((a, b) => (a.avgAccuracy ?? 0) - (b.avgAccuracy ?? 0));
    const hardest = sorted[0] ?? null;

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-violet-500/10 flex items-center justify-center">
                    <Sparkles size={14} className="text-violet-500" />
                </div>
                <h3 className="font-bold text-sm">Práctica con IA — Métricas del Grupo</h3>
            </div>

            {/* Summary KPIs */}
            <div className="grid grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-950/30 border border-violet-200/50 dark:border-violet-800/50 text-center">
                    <p className="text-2xl font-black text-violet-700 dark:text-violet-300">{totalSessions}</p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Sesiones</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-800/50 text-center">
                    <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                        {overallAvg !== null ? `${overallAvg}%` : "—"}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Precisión</p>
                </div>
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-800/50 text-center">
                    <p className="text-2xl font-black text-blue-700 dark:text-blue-300">
                        {byLesson.reduce((s, l) => Math.max(s, l.studentCount), 0)}/{totalEnrolled}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">Participaron</p>
                </div>
            </div>

            {/* Hardest lesson insight */}
            {hardest && hardest.avgAccuracy !== null && hardest.avgAccuracy < 70 && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/50">
                    <AlertCircle size={16} className="text-amber-500 flex-shrink-0" />
                    <div>
                        <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Clase con más dificultad</p>
                        <p className="text-xs text-amber-800 dark:text-amber-300">
                            "<strong>{hardest.lessonTopic}</strong>" — precisión promedio: {hardest.avgAccuracy}%
                        </p>
                    </div>
                </div>
            )}

            {/* Per-lesson breakdown */}
            <div className="space-y-2">
                {byLesson.map((lesson) => {
                    const pct = lesson.avgAccuracy;
                    const barColor = pct === null ? "bg-muted"
                        : pct >= 80 ? "bg-emerald-500"
                            : pct >= 60 ? "bg-amber-500"
                                : "bg-red-500";
                    const textColor = pct === null ? "text-muted-foreground"
                        : pct >= 80 ? "text-emerald-600 dark:text-emerald-400"
                            : pct >= 60 ? "text-amber-600 dark:text-amber-400"
                                : "text-red-600 dark:text-red-400";

                    const formattedDate = format(addHours(new Date(lesson.lessonDate), 12), "d MMM", { locale: es });

                    return (
                        <div key={lesson.lessonId} className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-background/50">
                            <Mic2 size={14} className="text-violet-400 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2 mb-1">
                                    <p className="text-xs font-bold truncate">{lesson.lessonTopic}</p>
                                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formattedDate}</span>
                                </div>
                                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={cn("h-full rounded-full transition-all", barColor)}
                                        style={{ width: pct !== null ? `${pct}%` : "0%" }}
                                    />
                                </div>
                            </div>
                            <div className="text-right shrink-0 min-w-[60px]">
                                <p className={cn("text-sm font-black", textColor)}>
                                    {pct !== null ? `${pct}%` : "—"}
                                </p>
                                <p className="text-[10px] text-muted-foreground">
                                    {lesson.studentCount}/{totalEnrolled} alumnos
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
