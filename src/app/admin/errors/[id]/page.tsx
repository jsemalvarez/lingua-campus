import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronLeft, Mail } from "lucide-react";
import { requireSuperadmin } from "@/lib/authz";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import { countNewIssues, getIssueDetail } from "@/lib/errors/panel";
import { AdminNavbar } from "../../institutes/AdminNavbar";
import { areaLabel, areaStyle } from "../areaStyles";
import { IssueStatusButton } from "../IssueStatusButton";

const veces = (n: number) => (n === 1 ? "vez" : "veces");
const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

export default async function AdminErrorDetailPage({ params }: { params: Promise<{ id: string }> }) {
    if (!await requireSuperadmin()) redirect("/login");

    const { id } = await params;
    const [issue, newCount] = await Promise.all([getIssueDetail(id), countNewIssues()]);
    if (!issue) notFound();

    const maxPerDay = Math.max(...issue.days.map((d) => d.count), 1);
    const totalInChart = issue.days.reduce((sum, d) => sum + d.count, 0);
    const style = areaStyle(issue.area);
    const resolved = issue.status === "RESOLVED";

    return (
        <div className="min-h-screen bg-background text-foreground">
            <AdminNavbar newErrors={newCount} />

            <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
                <Link href="/admin/errors" className="inline-flex items-center gap-1.5 min-h-11 text-sm font-semibold text-primary hover:underline">
                    <ChevronLeft size={16} aria-hidden="true" />
                    Volver a los errores
                </Link>

                <Card className="space-y-4 border-border/40">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="flex-1 min-w-0 space-y-2.5">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-md", style.badge)}>{areaLabel(issue.area)}</span>
                                {resolved ? (
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md text-emerald-800 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/60">
                                        Resuelto {issue.resolvedAt}
                                    </span>
                                ) : (
                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-md text-orange-800 bg-orange-50 dark:text-orange-300 dark:bg-orange-950/60">
                                        Abierto
                                    </span>
                                )}
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">{issue.action}</h1>
                            <p className="font-mono text-xs sm:text-sm break-words rounded-lg bg-muted/60 border border-border/60 px-3.5 py-3">{issue.message}</p>
                        </div>
                        <IssueStatusButton issueId={issue.id} status={issue.status} />
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                        Si vuelve a pasar después de marcarlo resuelto, se reabre solo y te llega el mail de nuevo.
                    </p>
                </Card>

                <section aria-label="En números" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Number label="Veces en total"><span className="text-3xl font-extrabold tabular-nums">{issue.count}</span></Number>
                    <Number label="Lo vieron">
                        <span className="text-3xl font-extrabold tabular-nums">{issue.visible}</span>{" "}
                        <span className="text-sm font-semibold text-muted-foreground">
                            {veces(issue.visible)}{issue.people > 0 && `, ${issue.people} ${issue.people === 1 ? "persona" : "personas distintas"}`}
                        </span>
                    </Number>
                    <Number label="Primera vez"><span className="text-lg font-bold">{capitalize(issue.firstSeen)}</span></Number>
                    <Number label="Última vez"><span className="text-lg font-bold">{capitalize(issue.lastSeen)}</span></Number>
                </section>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                    <section aria-labelledby="dias">
                        <Card className="space-y-4 border-border/40">
                            <h2 id="dias" className="text-base font-bold">Últimos 14 días</h2>
                            <div
                                role="img"
                                aria-label={`${totalInChart} ${veces(totalInChart)} en los últimos 14 días`}
                                className="flex items-end gap-1.5 h-28 border-b border-border"
                            >
                                {issue.days.map((day) => (
                                    <div
                                        key={day.label}
                                        title={`${day.label}: ${day.count} ${veces(day.count)}`}
                                        className={cn("flex-1 rounded-t", day.count > 0 ? style.bar : "bg-border")}
                                        style={{ height: day.count > 0 ? `${Math.max((day.count / maxPerDay) * 100, 6)}%` : "3px" }}
                                    />
                                ))}
                            </div>
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>{issue.days[0].label}</span>
                                <span>Hoy</span>
                            </div>
                        </Card>
                    </section>

                    <section aria-labelledby="donde">
                        <Card className="space-y-3 border-border/40">
                            <h2 id="donde" className="text-base font-bold">En qué institutos</h2>
                            {issue.scopes.map((scope) => (
                                <div key={scope.scope} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/60 px-4 py-3">
                                    <div>
                                        <p className="text-sm sm:text-[15px] font-semibold">{scope.name}</p>
                                        <p className="text-xs sm:text-sm text-muted-foreground">
                                            {scope.count} {veces(scope.count)} · desde {scope.firstSeen}
                                        </p>
                                    </div>
                                    {scope.notified ? (
                                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary">
                                            <Mail size={14} aria-hidden="true" />
                                            Mail enviado {scope.notified}
                                        </span>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">Sin mail</span>
                                    )}
                                </div>
                            ))}
                            {issue.scopes.length === 1 && (
                                <p className="text-xs sm:text-sm text-muted-foreground">Por ahora, solo en este instituto.</p>
                            )}
                        </Card>
                    </section>
                </div>

                <section aria-labelledby="veces">
                    <Card className="p-0 sm:p-0 overflow-hidden border-border/40">
                        <div className="flex flex-wrap items-baseline justify-between gap-2 px-4 sm:px-6 pt-5 pb-3">
                            <h2 id="veces" className="text-base font-bold">Las últimas veces</h2>
                            <span className="text-xs sm:text-sm text-muted-foreground">se guardan 90 días</span>
                        </div>
                        {issue.events.length === 0 ? (
                            <p className="px-6 pb-8 pt-2 text-sm text-muted-foreground">Las veces que pasó ya tienen más de 90 días.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[720px] text-sm">
                                    <thead>
                                        <tr className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                            <th scope="col" className="px-4 sm:px-6 py-2.5 font-semibold">Cuándo</th>
                                            <th scope="col" className="px-3 py-2.5 font-semibold">Quién</th>
                                            <th scope="col" className="px-3 py-2.5 font-semibold">Qué hacía</th>
                                            <th scope="col" className="px-3 py-2.5 font-semibold">Pantalla</th>
                                            <th scope="col" className="px-4 sm:px-6 py-2.5 font-semibold">Vio el cartel</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {issue.events.map((event) => (
                                            <tr key={event.id} className="border-t border-border/40">
                                                <td className="px-4 sm:px-6 py-3 whitespace-nowrap tabular-nums">{capitalize(event.when)}</td>
                                                <td className="px-3 py-3">{event.who}</td>
                                                <td className="px-3 py-3 text-foreground/80">{event.what ?? "—"}</td>
                                                <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{event.path ?? "—"}</td>
                                                <td className="px-4 sm:px-6 py-3">{event.seen ? "Sí" : "No"}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Card>
                </section>
            </main>
        </div>
    );
}

function Number({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <Card className="p-4 sm:p-4 flex flex-col gap-1 border-border/40">
            <span className="text-xs sm:text-sm text-muted-foreground">{label}</span>
            <div>{children}</div>
        </Card>
    );
}
