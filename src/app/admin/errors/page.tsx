import Link from "next/link";
import { redirect } from "next/navigation";
import { requireSuperadmin } from "@/lib/authz";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/dates";
import { atWhen, countIssuesByStatus, countNewIssues, getDaySummary, listIssues, type IssueStatus } from "@/lib/errors/panel";
import { AdminNavbar } from "../institutes/AdminNavbar";
import { AREA_KEYS, areaLabel, areaStyle, isErrorArea } from "./areaStyles";

type SearchParams = Promise<{ estado?: string; area?: string }>;

function listHref(status: IssueStatus, area?: string): string {
    const params = new URLSearchParams();
    if (status === "RESOLVED") params.set("estado", "resueltos");
    if (area) params.set("area", area);
    const query = params.toString();
    return query ? `/admin/errors?${query}` : "/admin/errors";
}

export default async function AdminErrorsPage({ searchParams }: { searchParams: SearchParams }) {
    if (!await requireSuperadmin()) redirect("/login");

    const { estado, area: areaParam } = await searchParams;
    const status: IssueStatus = estado === "resueltos" ? "RESOLVED" : "OPEN";
    const area = isErrorArea(areaParam) ? areaParam : null;

    const now = new Date();
    const [summary, issues, byStatus, newCount] = await Promise.all([
        getDaySummary(now),
        listIssues(status, now),
        countIssuesByStatus(),
        countNewIssues(now),
    ]);
    const rows = area ? issues.filter((i) => i.area === area) : issues;

    return (
        <div className="min-h-screen bg-background text-foreground">
            <AdminNavbar newErrors={newCount} />

            <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
                <header className="flex flex-wrap items-end justify-between gap-3">
                    <div className="space-y-1">
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">Errores del campus</h1>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            Lo que les falló a los institutos, agrupado por problema. Te llega un mail la primera vez que alguien lo ve en cada instituto.
                        </p>
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">Actualizado a las {formatTime(now)}</p>
                </header>

                <section aria-labelledby="resumen">
                    <Card className="space-y-5 border-border/40">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <h2 id="resumen" className="text-base sm:text-lg font-bold">Últimas 24 horas</h2>
                            <span className="text-xs sm:text-sm text-muted-foreground">desde {atWhen(summary.since, now)}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <Stat
                                value={summary.newIssues}
                                label={summary.newIssues === 1 ? "problema nuevo" : "problemas nuevos"}
                                note={summary.newIssueNames}
                                warm={summary.newIssues > 0}
                            />
                            <Stat
                                value={summary.visible}
                                label={summary.visible === 1 ? "vez que alguien vio un error" : "veces que alguien vio un error"}
                                note={summary.topVisible}
                            />
                            <Stat
                                value={summary.institutesWithFailures}
                                of={summary.totalInstitutes}
                                label="institutos con fallas"
                                note={summary.instituteNames}
                            />
                            <Stat
                                value={summary.silent}
                                label={summary.silent === 1 ? "falla silenciosa" : "fallas silenciosas"}
                                note="nadie vio un cartel; sin mail"
                            />
                        </div>
                    </Card>
                </section>

                <section aria-labelledby="lista" className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 id="lista" className="text-base sm:text-lg font-bold">Problemas</h2>
                        <nav aria-label="Estado" className="flex gap-0.5 rounded-xl bg-muted p-1">
                            <StatusTab href={listHref("OPEN")} active={status === "OPEN"} label={`Abiertos · ${byStatus.OPEN}`} />
                            <StatusTab href={listHref("RESOLVED")} active={status === "RESOLVED"} label={`Resueltos · ${byStatus.RESOLVED}`} />
                        </nav>
                    </div>

                    <nav aria-label="Filtrar por área" className="flex flex-wrap gap-2">
                        <AreaChip href={listHref(status)} active={!area} label="Todas" count={issues.length} activeClass="bg-foreground text-background border-foreground" />
                        {AREA_KEYS.map((key) => (
                            <AreaChip
                                key={key}
                                href={listHref(status, key)}
                                active={area === key}
                                label={areaLabel(key)}
                                count={issues.filter((i) => i.area === key).length}
                                activeClass={areaStyle(key).chip}
                            />
                        ))}
                    </nav>

                    <Card className="p-0 sm:p-0 overflow-hidden border-border/40">
                        <div className="hidden md:flex gap-4 px-5 py-3 bg-muted/50 border-b border-border/60 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            <span className="flex-1 min-w-0">Qué falló</span>
                            <span className="w-44 shrink-0">Institutos</span>
                            <span className="w-16 shrink-0 text-right">Veces</span>
                            <span className="w-28 shrink-0 text-right">Última vez</span>
                        </div>

                        {rows.map((row) => (
                            <Link
                                key={row.id}
                                href={`/admin/errors/${row.id}`}
                                className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 px-4 sm:px-5 py-4 border-b border-border/40 last:border-b-0 hover:bg-primary/5 transition-colors"
                            >
                                <div className="flex-1 min-w-0 space-y-1.5">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-md", areaStyle(row.area).badge)}>
                                            {areaLabel(row.area)}
                                        </span>
                                        <span className="text-sm sm:text-[15px] font-semibold">{row.action}</span>
                                        {row.isNew && (
                                            <span className="text-[11px] font-bold px-2 py-px rounded-full text-orange-800 bg-orange-50 border border-orange-200 dark:text-orange-300 dark:bg-orange-950/60 dark:border-orange-900">
                                                Nuevo
                                            </span>
                                        )}
                                        {row.silent && (
                                            <span className="text-[11px] font-semibold px-2 py-px rounded-full text-muted-foreground border border-dashed border-muted-foreground/50">
                                                Silencioso
                                            </span>
                                        )}
                                    </div>
                                    <p className="font-mono text-xs text-muted-foreground truncate">{row.message}</p>
                                </div>
                                <span className="md:w-44 md:shrink-0 text-sm text-foreground/80">{row.institutes}</span>
                                <span className="md:w-16 md:shrink-0 md:text-right text-sm font-bold tabular-nums">
                                    {row.count}<span className="md:hidden font-normal text-muted-foreground"> {row.count === 1 ? "vez" : "veces"}</span>
                                </span>
                                <span className="md:w-28 md:shrink-0 md:text-right text-xs sm:text-sm text-muted-foreground">{row.last}</span>
                            </Link>
                        ))}

                        {rows.length === 0 && (
                            <p className="py-12 px-5 text-center text-sm text-muted-foreground">
                                {area
                                    ? "No hay problemas en esta área."
                                    : status === "OPEN" ? "No hay problemas abiertos." : "Todavía no marcaste ningún problema como resuelto."}
                            </p>
                        )}
                    </Card>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Cada vez que pasa algo se guarda 90 días. El problema, con su total y sus institutos, queda siempre.
                    </p>
                </section>
            </main>
        </div>
    );
}

function Stat({ value, of, label, note, warm = false }: { value: number; of?: number; label: string; note?: string | null; warm?: boolean }) {
    return (
        <div className={cn("rounded-xl px-4 py-4 flex flex-col gap-1", warm ? "bg-orange-50 dark:bg-orange-950/40" : "bg-muted/60")}>
            <span className={cn("text-3xl font-extrabold leading-none tabular-nums", warm && "text-orange-800 dark:text-orange-300")}>
                {value}
                {of !== undefined && <span className="text-lg font-semibold text-muted-foreground"> de {of}</span>}
            </span>
            <span className={cn("text-sm font-semibold", warm && "text-orange-900 dark:text-orange-200")}>{label}</span>
            {note && <span className={cn("text-xs", warm ? "text-orange-900/80 dark:text-orange-200/80" : "text-muted-foreground")}>{note}</span>}
        </div>
    );
}

function StatusTab({ href, active, label }: { href: string; active: boolean; label: string }) {
    return (
        <Link
            href={href}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={cn(
                "inline-flex items-center min-h-10 px-4 rounded-lg text-sm font-semibold transition-colors",
                active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            )}
        >
            {label}
        </Link>
    );
}

function AreaChip({ href, active, label, count, activeClass }: { href: string; active: boolean; label: string; count: number; activeClass: string }) {
    return (
        <Link
            href={href}
            scroll={false}
            aria-current={active ? "true" : undefined}
            className={cn(
                "inline-flex items-center gap-1.5 min-h-10 px-3.5 rounded-full border text-sm font-medium transition-colors",
                active
                    ? activeClass
                    : cn("bg-card border-border hover:border-primary", count > 0 ? "text-foreground/80" : "text-muted-foreground/70")
            )}
        >
            {label} <span className="font-bold tabular-nums">{count}</span>
        </Link>
    );
}
