"use client";

import { CreateLessonModal } from "./CreateLessonModal";
import { ClipboardCheck, Calendar, BookOpen, FileText, FileEdit } from "lucide-react";
import { EditLessonModal } from "./EditLessonModal";
import { DeleteLessonButton } from "./DeleteLessonButton";
import Link from "next/link";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Lesson {
    id: string;
    courseId: string;
    type: "CLASS" | "TP" | "EXAM";
    date: Date;
    topic: string;
    content: string | null;
}

interface LessonListProps {
    courseId: string;
    lessons: Lesson[];
    isTeacherOrAdmin: boolean;
}

export function LessonList({ courseId, lessons, isTeacherOrAdmin }: LessonListProps) {
    return (
        <div className="space-y-4">
            {isTeacherOrAdmin && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mb-6 relative z-10">
                    <CreateLessonModal courseId={courseId} lessonType="CLASS" />
                    <CreateLessonModal courseId={courseId} lessonType="TP" />
                    <CreateLessonModal courseId={courseId} lessonType="EXAM" />
                </div>
            )}

            {lessons.length === 0 ? (
                <div className="text-center p-6 border border-dashed rounded-xl border-border/50 text-muted-foreground text-sm flex flex-col items-center">
                    <BookOpen size={24} className="mb-2 opacity-50" />
                    El libro de temas está vacío para este curso.
                </div>
            ) : (
                <div className="space-y-4">
                    {lessons.map((lesson) => {
                        let borderColor = "bg-blue-500/80";
                        if (lesson.type === "TP") borderColor = "bg-amber-500/80";
                        if (lesson.type === "EXAM") borderColor = "bg-red-500/80";

                        return (
                            <div key={lesson.id} className="relative p-4 sm:p-5 rounded-xl border border-border/60 bg-background/50 shadow-sm hover:shadow-md transition-all group overflow-hidden">
                                <div className={`absolute top-0 left-0 w-1.5 h-full rounded-l-xl ${borderColor}`}></div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="space-y-1.5 pl-2">
                                        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                                            <Calendar size={14} className={lesson.type === "CLASS" ? "text-blue-500" : lesson.type === "TP" ? "text-amber-500" : "text-red-500"} />
                                            {format(new Date(lesson.date), "EEEE, d 'de' MMMM, yyyy", { locale: es })}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-base font-bold leading-tight">{lesson.topic}</h3>
                                            {isTeacherOrAdmin && (
                                                <div className="flex items-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity gap-1">
                                                    <EditLessonModal courseId={courseId} lesson={lesson} />
                                                    <DeleteLessonButton courseId={courseId} lessonId={lesson.id} />
                                                </div>
                                            )}
                                        </div>
                                        {lesson.content && (
                                            <p className="text-sm text-foreground/70 mt-1 line-clamp-2">
                                                {lesson.content}
                                            </p>
                                        )}
                                    </div>

                                    {isTeacherOrAdmin && (
                                        <div className="shrink-0 flex sm:flex-col justify-end gap-2 w-full sm:w-auto">
                                            <Link href={`/courses/${courseId}/lessons/${lesson.id}/attendance`} className="w-full">
                                                <div className="px-4 py-2 sm:px-3 sm:py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer border whitespace-nowrap">
                                                    <ClipboardCheck size={16} /> Asistencia
                                                </div>
                                            </Link>

                                            {lesson.type === "CLASS" ? (
                                                <div className="w-full">
                                                    <div className="px-4 py-2 sm:px-3 sm:py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-blue-500/20 whitespace-nowrap">
                                                        <BookOpen size={16} /> Práctica
                                                    </div>
                                                </div>
                                            ) : (
                                                <Link href={`/courses/${courseId}/lessons/${lesson.id}/grades`} className="w-full">
                                                    <div className={`px-4 py-2 sm:px-3 sm:py-2.5 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer border whitespace-nowrap ${lesson.type === "TP"
                                                        ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/20"
                                                        : "bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/20"
                                                        }`}>
                                                        <FileText size={16} /> Notas
                                                    </div>
                                                </Link>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
