"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Cake } from "lucide-react";
import type { BirthdayStudent } from "./BirthdayWidgetServer";

const MONTH_NAMES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function formatBirthdayDate(student: BirthdayStudent): string {
    if (student.isToday) return "Hoy 🎉";
    if (student.daysUntil === 1) return "Mañana";
    const d = new Date(student.nextBirthday);
    return `${DAY_NAMES[d.getDay()]} ${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)}`;
}

function getInitials(name: string): string {
    return name
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();
}

// Deterministic pastel color from name
function getAvatarColor(name: string): string {
    const colors = [
        "bg-pink-200 text-pink-800",
        "bg-purple-200 text-purple-800",
        "bg-blue-200 text-blue-800",
        "bg-emerald-200 text-emerald-800",
        "bg-amber-200 text-amber-800",
        "bg-rose-200 text-rose-800",
        "bg-cyan-200 text-cyan-800",
        "bg-indigo-200 text-indigo-800",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

interface BirthdayWidgetProps {
    weekBirthdays: BirthdayStudent[];
    monthBirthdays: BirthdayStudent[];
    currentMonth: number;
}

export function BirthdayWidget({ weekBirthdays, monthBirthdays, currentMonth }: BirthdayWidgetProps) {
    const [view, setView] = useState<"week" | "month">("week");

    const list = view === "week" ? weekBirthdays : monthBirthdays;
    const todayBirthdays = list.filter((s) => s.isToday);
    const upcomingBirthdays = list.filter((s) => !s.isToday);

    const monthName = MONTH_NAMES[currentMonth - 1];

    return (
        <Card variant="premium-glass" className="p-6 relative overflow-hidden group !bg-gradient-to-r !from-blue-900/40 !to-sky-100/60 dark:!from-sky-950/40 dark:!to-sky-400/40">
            {/* Ambient glow */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-pink-500/5 rounded-full blur-3xl group-hover:bg-pink-500/10 transition-colors duration-700 pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-5 relative z-10">
                <h3 className="font-bold text-lg flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-pink-100 dark:bg-pink-950/60">
                        <Cake size={17} className="text-pink-600 dark:text-pink-400" />
                    </span>
                    Cumpleaños
                </h3>

                {/* Toggle */}
                <div className="flex items-center bg-muted rounded-lg p-0.5 text-xs font-semibold">
                    <button
                        onClick={() => setView("week")}
                        className={`px-3 py-1.5 rounded-md transition-all duration-200 ${view === "week"
                            ? "bg-background shadow text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        Esta semana
                    </button>
                    <button
                        onClick={() => setView("month")}
                        className={`px-3 py-1.5 rounded-md transition-all duration-200 ${view === "month"
                            ? "bg-background shadow text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {monthName}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 space-y-1">
                {/* TODAY section */}
                {todayBirthdays.length > 0 && (
                    <>
                        <div className="text-[10px] uppercase tracking-widest text-pink-500 font-bold px-1 pb-1">
                            Hoy 🎉
                        </div>
                        {todayBirthdays.map((student) => (
                            <BirthdayRow key={student.id} student={student} />
                        ))}
                        {upcomingBirthdays.length > 0 && (
                            <div className="border-t border-border/50 my-3" />
                        )}
                    </>
                )}

                {/* UPCOMING section */}
                {upcomingBirthdays.length > 0 && (
                    <>
                        {todayBirthdays.length > 0 && (
                            <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold px-1 pb-1">
                                {view === "week" ? "Próximos 7 días" : `Resto de ${monthName}`}
                            </div>
                        )}
                        {upcomingBirthdays.map((student) => (
                            <BirthdayRow key={student.id} student={student} />
                        ))}
                    </>
                )}

                {/* Empty state */}
                {list.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                            <Cake size={22} className="text-muted-foreground/50" />
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">
                            {view === "week"
                                ? "Sin cumpleaños en los próximos 7 días"
                                : `Sin cumpleaños registrados en ${monthName}`}
                        </p>
                        <p className="text-xs text-muted-foreground/60">
                            Asegurate de cargar la fecha de nacimiento de los alumnos
                        </p>
                    </div>
                )}
            </div>
        </Card>
    );
}

function BirthdayRow({ student }: { student: BirthdayStudent }) {
    const initials = getInitials(student.name);
    const avatarColor = getAvatarColor(student.name);
    const dateLabel = formatBirthdayDate(student);

    return (
        <Link
            href={`/students/${student.id}`}
            className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-muted/60 transition-colors group/row"
        >
            {/* Avatar */}
            <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${avatarColor} ${student.isToday ? "ring-2 ring-pink-400 ring-offset-1" : ""
                    }`}
            >
                {initials}
            </div>

            {/* Name + Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate group-hover/row:text-primary transition-colors">
                        {student.name}
                    </p>
                    {student.turningAge > 0 && (
                        <span className="text-[10px] bg-primary/20 text-sky-100 dark:text-primary border border-sky-100 dark:border-primary px-1.5 py-0.5 rounded-full font-medium whitespace-nowrap">
                            Cumple {student.turningAge}
                        </span>
                    )}
                </div>
                {student.courseNames && (
                    <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                        {student.courseNames}
                    </p>
                )}
            </div>

            {/* Date + badge */}
            <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground">{dateLabel}</span>
                {!student.isToday && (
                    <span className="text-[10px] font-bold tabular-nums bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md">
                        +{student.daysUntil}d
                    </span>
                )}
                {student.isToday && (
                    <span className="text-[10px] font-bold bg-pink-100 dark:bg-pink-950/60 text-pink-600 dark:text-pink-400 px-1.5 py-0.5 rounded-md">
                        hoy
                    </span>
                )}
            </div>
        </Link>
    );
}
