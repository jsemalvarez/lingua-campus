import prisma from "@/lib/prisma";
import { dayFromKey, dayKey, formatDate, formatTime, instituteTodayKey } from "@/lib/dates";
import { actionLabel, describeContext, roleLabel } from "./alert";
import type { ErrorContext } from "./report";

/**
 * Las consultas del panel de errores (ARQ-09), sólo para el superadmin: quien las
 * llama ya controló el permiso.
 *
 * **Los totales salen de `ErrorIssue` y lo demás de `ErrorEvent`.** La retención
 * borra los eventos de más de 90 días, así que lo que se cuenta sobre eventos —las
 * personas distintas, «silencioso», los días— mira sólo esos 90 días.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const NO_INSTITUTE_SCOPE = "PLATAFORMA";
const NO_INSTITUTE_LABEL = "Plataforma";
const MAX_LISTED_ISSUES = 300;
const LAST_EVENTS = 20;
const CHART_DAYS = 14;

export type IssueStatus = "OPEN" | "RESOLVED";

/** Un problema es «nuevo» durante las primeras 24 horas. */
function newSince(now: Date): Date {
    return new Date(now.getTime() - DAY_MS);
}

/** Lo que muestra la insignia de la barra: los nuevos que siguen abiertos. */
export function countNewIssues(now: Date = new Date()): Promise<number> {
    return prisma.errorIssue.count({ where: { status: "OPEN", firstSeenAt: { gte: newSince(now) } } });
}

async function instituteNames(): Promise<Map<string, string>> {
    const institutes = await prisma.institute.findMany({ select: { id: true, name: true } });
    return new Map(institutes.map((i) => [i.id, i.name]));
}

function scopeName(scope: string, names: Map<string, string>): string {
    if (scope === NO_INSTITUTE_SCOPE) return NO_INSTITUTE_LABEL;
    return names.get(scope) ?? "Instituto borrado";
}

/** «A · B · C y 2 más». */
function firstFew(items: string[], max = 3): string {
    if (items.length <= max) return items.join(" · ");
    return `${items.slice(0, max).join(" · ")} y ${items.length - max} más`;
}

// ─── Resumen de las últimas 24 horas ────────────────────────────────────────

export async function getDaySummary(now: Date = new Date()) {
    const since = newSince(now);
    const recent = { createdAt: { gte: since } };

    const [newIssues, visibleByIssue, silent, withInstitute, totalInstitutes, names] = await Promise.all([
        prisma.errorIssue.findMany({
            where: { firstSeenAt: { gte: since } },
            orderBy: { firstSeenAt: "desc" },
            select: { action: true },
        }),
        prisma.errorEvent.groupBy({
            by: ["issueId"],
            where: { ...recent, shownToUser: true },
            _count: { _all: true },
            orderBy: { _count: { issueId: "desc" } },
        }),
        prisma.errorEvent.count({ where: { ...recent, shownToUser: false } }),
        prisma.errorEvent.findMany({
            where: { ...recent, instituteId: { not: null } },
            distinct: ["instituteId"],
            select: { instituteId: true },
        }),
        prisma.institute.count(),
        instituteNames(),
    ]);

    const visible = visibleByIssue.reduce((sum, row) => sum + row._count._all, 0);
    const top = visibleByIssue[0];
    const topIssue = top
        ? await prisma.errorIssue.findUnique({ where: { id: top.issueId }, select: { action: true } })
        : null;

    return {
        since,
        newIssues: newIssues.length,
        newIssueNames: firstFew(newIssues.map((i) => actionLabel(i.action))),
        visible,
        // Sólo si hay más de un problema: con uno solo, repetiría el número grande.
        topVisible: top && topIssue && visibleByIssue.length > 1 ? `${top._count._all} en «${actionLabel(topIssue.action)}»` : null,
        institutesWithFailures: withInstitute.length,
        totalInstitutes,
        instituteNames: firstFew(withInstitute.map((e) => scopeName(e.instituteId!, names))),
        silent,
    };
}

// ─── La lista ───────────────────────────────────────────────────────────────

export async function listIssues(status: IssueStatus, now: Date = new Date()) {
    const issues = await prisma.errorIssue.findMany({
        where: { status },
        orderBy: { lastSeenAt: "desc" },
        take: MAX_LISTED_ISSUES,
        select: {
            id: true,
            action: true,
            area: true,
            kind: true,
            message: true,
            count: true,
            firstSeenAt: true,
            lastSeenAt: true,
            scopes: { select: { scope: true }, orderBy: { lastSeenAt: "desc" } },
        },
    });

    const [names, shownByIssue] = await Promise.all([
        instituteNames(),
        prisma.errorEvent.groupBy({
            by: ["issueId", "shownToUser"],
            where: { issueId: { in: issues.map((i) => i.id) } },
        }),
    ]);

    const withEvents = new Set(shownByIssue.map((row) => row.issueId));
    const seen = new Set(shownByIssue.filter((row) => row.shownToUser).map((row) => row.issueId));
    const since = newSince(now);

    return issues.map((issue) => ({
        id: issue.id,
        area: issue.area,
        action: actionLabel(issue.action),
        message: `${issue.kind} · ${issue.message}`,
        count: issue.count,
        institutes: issue.scopes.map((s) => scopeName(s.scope, names)).join(", "),
        last: relativeWhen(issue.lastSeenAt, now),
        isNew: issue.firstSeenAt >= since,
        // Si la retención ya borró todos sus eventos no se puede saber: no se afirma.
        silent: withEvents.has(issue.id) && !seen.has(issue.id),
    }));
}

/** Cuántos problemas hay en cada pestaña. */
export async function countIssuesByStatus(): Promise<Record<IssueStatus, number>> {
    const rows = await prisma.errorIssue.groupBy({ by: ["status"], _count: { _all: true } });
    const of = (status: IssueStatus) => rows.find((r) => r.status === status)?._count._all ?? 0;
    return { OPEN: of("OPEN"), RESOLVED: of("RESOLVED") };
}

// ─── Un problema ────────────────────────────────────────────────────────────

export async function getIssueDetail(id: string, now: Date = new Date()) {
    const issue = await prisma.errorIssue.findUnique({
        where: { id },
        include: { scopes: { orderBy: { lastSeenAt: "desc" } } },
    });
    if (!issue) return null;

    const todayKey = instituteTodayKey(now);
    const dayKeys = Array.from({ length: CHART_DAYS }, (_, i) =>
        dayKey(new Date(dayFromKey(todayKey).getTime() - (CHART_DAYS - 1 - i) * DAY_MS))
    );

    const [names, events, chartEvents, visible, people] = await Promise.all([
        instituteNames(),
        prisma.errorEvent.findMany({
            where: { issueId: id },
            orderBy: { createdAt: "desc" },
            take: LAST_EVENTS,
            select: { id: true, createdAt: true, role: true, instituteId: true, path: true, shownToUser: true, context: true },
        }),
        prisma.errorEvent.findMany({
            // Un día de más, para no perder la madrugada del primero por el huso.
            where: { issueId: id, createdAt: { gte: new Date(dayFromKey(dayKeys[0]).getTime() - DAY_MS) } },
            select: { createdAt: true },
        }),
        prisma.errorEvent.count({ where: { issueId: id, shownToUser: true } }),
        prisma.errorEvent.groupBy({
            by: ["subjectId"],
            where: { issueId: id, shownToUser: true, subjectId: { not: null } },
        }),
    ]);

    const perDay = new Map(dayKeys.map((key) => [key, 0]));
    for (const event of chartEvents) {
        const key = instituteTodayKey(event.createdAt);
        if (perDay.has(key)) perDay.set(key, perDay.get(key)! + 1);
    }

    // Varios eventos suelen venir de la misma clase: no repetir las consultas.
    const contexts = new Map<string, Promise<string | null>>();
    const describe = (context: unknown) => {
        if (!context) return Promise.resolve(null);
        const key = JSON.stringify(context);
        if (!contexts.has(key)) contexts.set(key, describeContext(context as ErrorContext));
        return contexts.get(key)!;
    };

    const severalScopes = issue.scopes.length > 1;

    return {
        id: issue.id,
        area: issue.area,
        action: actionLabel(issue.action),
        message: `${issue.kind} · ${issue.message}`,
        status: issue.status as IssueStatus,
        resolvedAt: issue.resolvedAt ? atWhen(issue.resolvedAt, now) : null,
        count: issue.count,
        visible,
        people: people.length,
        firstSeen: atWhen(issue.firstSeenAt, now),
        lastSeen: relativeWhen(issue.lastSeenAt, now),
        days: dayKeys.map((key) => ({
            label: formatDate(dayFromKey(key), "day", "numericDayMonth"),
            count: perDay.get(key)!,
        })),
        scopes: issue.scopes.map((scope) => ({
            scope: scope.scope,
            name: scopeName(scope.scope, names),
            count: scope.count,
            firstSeen: atWhen(scope.firstSeenAt, now),
            notified: scope.notifiedAt ? atWhen(scope.notifiedAt, now) : null,
        })),
        events: await Promise.all(
            events.map(async (event) => ({
                id: event.id,
                when: atWhen(event.createdAt, now),
                // El instituto hace falta sólo si el problema está en más de uno.
                who: severalScopes
                    ? `${roleLabel(event.role)} · ${scopeName(event.instituteId ?? NO_INSTITUTE_SCOPE, names)}`
                    : roleLabel(event.role),
                what: await describe(event.context),
                path: event.path,
                seen: event.shownToUser,
            }))
        ),
    };
}

// ─── Cómo se dice cuándo ────────────────────────────────────────────────────

function yesterdayKey(now: Date): string {
    return dayKey(new Date(dayFromKey(instituteTodayKey(now)).getTime() - DAY_MS));
}

function dayOf(at: Date, now: Date): string {
    const year = at.getUTCFullYear() === now.getUTCFullYear() ? "numericDayMonth" : "numeric";
    return formatDate(at, "moment", year);
}

/** «hoy, 08:05», «ayer, 21:10», «28/10, 14:03». */
export function atWhen(at: Date, now: Date = new Date()): string {
    const key = instituteTodayKey(at);
    const time = formatTime(at);
    if (key === instituteTodayKey(now)) return `hoy, ${time}`;
    if (key === yesterdayKey(now)) return `ayer, ${time}`;
    return `${dayOf(at, now)}, ${time}`;
}

/** «hace 12 min», «hace 3 h», «ayer 21:10», «28/10». Para mirar de un vistazo. */
function relativeWhen(at: Date, now: Date): string {
    const minutes = Math.floor((now.getTime() - at.getTime()) / 60_000);
    if (minutes < 1) return "recién";
    if (minutes < 60) return `hace ${minutes} min`;

    const key = instituteTodayKey(at);
    if (key === instituteTodayKey(now)) return `hace ${Math.floor(minutes / 60)} h`;
    if (key === yesterdayKey(now)) return `ayer ${formatTime(at)}`;
    return dayOf(at, now);
}
