"use client";

import { useEffect, useState } from "react";
import { Check, Compass, ExternalLink, Eye, Gamepad2, Headphones, Lightbulb, Palette, Shapes, X, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { markResourcesSeen } from "@/lib/resourcesSeen";
import { cn } from "@/lib/utils";
import { TOOL_GROUPS, TOOLS, type Tool, type ToolChip, type ToolGroupId, type ToolId } from "../tools";
import { ToolSketch, WordwallGamesSketch } from "./ToolSketch";

/**
 * Colores de apoyo más oscuros que los del tema en modo claro: el gris
 * `muted-foreground` (#808080) y el verde `primary` (#38b397) no llegan a 4,5:1
 * sobre blanco con texto chico. En oscuro se usan los del tema, que sí llegan.
 */
const MUTED = "text-neutral-500 dark:text-muted-foreground";
const PRIMARY_TEXT = "text-[#1f7360] dark:text-primary";
const PRIMARY_BUTTON = "bg-[#23806a] text-white shadow-sm hover:bg-[#1f7360]";

const GROUP_STYLE: Record<ToolGroupId, { Icon: LucideIcon; iconBox: string; icon: string; band: string }> = {
    jugar: {
        Icon: Gamepad2,
        iconBox: "bg-orange-500/10 text-orange-500",
        icon: "text-orange-500",
        band: "bg-orange-50 dark:bg-orange-950/40",
    },
    escuchar: {
        Icon: Headphones,
        iconBox: "bg-blue-500/10 text-blue-500",
        icon: "text-blue-500",
        band: "bg-blue-50 dark:bg-blue-950/40",
    },
    crear: {
        Icon: Palette,
        iconBox: "bg-purple-500/10 text-purple-500",
        icon: "text-purple-500",
        band: "bg-purple-50 dark:bg-purple-950/40",
    },
};

/**
 * Página de recursos del docente: nueve herramientas externas agrupadas por lo
 * que se quiere hacer en clase. Cada tarjeta tiene dos puertas: «Abrir», para
 * quien ya la usa, y «¿Primera vez?», que abre una guía de tres pasos para quien
 * no la conoce.
 */
export function ResourcesView() {
    const [openId, setOpenId] = useState<ToolId | null>(null);
    const openTool = TOOLS.find((tool) => tool.id === openId) ?? null;

    // Apaga el punto de «nuevo» del menú (ver `resourcesSeen`).
    useEffect(() => {
        markResourcesSeen();
    }, []);

    // El `Dialog` compartido cierra con el fondo pero no con Escape.
    useEffect(() => {
        if (!openId) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") setOpenId(null);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [openId]);

    return (
        <main className="container mx-auto space-y-10 px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500 sm:px-6 md:space-y-12 md:py-10">
            <div className="space-y-5">
                <header className="flex flex-col items-start gap-3 md:gap-4">
                    <span className={cn("inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm font-semibold", PRIMARY_TEXT)}>
                        <Shapes className="size-4" />
                        Recursos
                    </span>
                    <h1 className="text-3xl font-extrabold tracking-tight text-foreground/90 sm:text-4xl lg:text-5xl">
                        Herramientas para tus clases
                    </h1>
                    <p className={cn("max-w-2xl text-base leading-relaxed sm:text-lg", MUTED)}>
                        Nueve herramientas con versión gratis, elegidas para clases de inglés. Si ya usás alguna, abrila desde
                        acá. Si es nueva para vos, tocá <strong className={cn("font-semibold", PRIMARY_TEXT)}>¿Primera vez?</strong> y
                        te mostramos cómo arrancar en tres pasos.
                    </p>
                </header>

                <nav aria-label="Secciones" className="flex gap-2 md:hidden">
                    {TOOL_GROUPS.map((group) => {
                        const { Icon, icon } = GROUP_STYLE[group.id];
                        return (
                            <a
                                key={group.id}
                                href={`#${group.id}`}
                                className="inline-flex h-11 items-center gap-1.5 rounded-full border border-border bg-card px-3 text-sm font-medium text-foreground"
                            >
                                <Icon className={cn("size-4", icon)} />
                                {group.shortTitle}
                            </a>
                        );
                    })}
                </nav>
            </div>

            {TOOL_GROUPS.map((group) => {
                const { Icon, iconBox } = GROUP_STYLE[group.id];
                return (
                    <section key={group.id} id={group.id} className="scroll-mt-20 space-y-4 md:space-y-6">
                        <div className="flex items-center gap-3 border-b border-border/60 pb-3">
                            <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl md:size-11", iconBox)}>
                                <Icon className="size-[22px] md:size-6" />
                            </span>
                            <div className="space-y-0.5">
                                <h2 className="text-xl font-bold tracking-tight md:text-2xl">{group.title}</h2>
                                <p className={cn("text-[13.5px] leading-snug md:text-sm", MUTED)}>{group.description}</p>
                            </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
                            {TOOLS.filter((tool) => tool.group === group.id).map((tool) => (
                                <ToolCard key={tool.id} tool={tool} onFirstTime={() => setOpenId(tool.id)} />
                            ))}
                        </div>
                    </section>
                );
            })}

            <Dialog open={openTool !== null} onOpenChange={(open) => { if (!open) setOpenId(null); }}>
                {openTool && (
                    <DialogContent className="flex max-h-[calc(100dvh-2rem)] max-w-2xl flex-col overflow-hidden p-0">
                        <ToolGuide tool={openTool} onClose={() => setOpenId(null)} />
                    </DialogContent>
                )}
            </Dialog>
        </main>
    );
}

function ToolCard({ tool, onFirstTime }: { tool: Tool; onFirstTime: () => void }) {
    return (
        <Card className="flex flex-col overflow-hidden p-0 sm:p-0">
            <div aria-hidden="true" className={cn("flex h-32 shrink-0 items-center justify-center", GROUP_STYLE[tool.group].band)}>
                <ToolSketch id={tool.id} />
            </div>
            <div className="flex flex-1 flex-col gap-3 p-4 md:p-5">
                <div className="flex items-baseline justify-between gap-2.5">
                    <h3 className="text-[17px] font-bold tracking-tight md:text-lg">{tool.name}</h3>
                    <span className={cn("text-xs", MUTED)}>{tool.domain}</span>
                </div>
                <p className={cn("text-sm leading-relaxed", MUTED)}>{tool.description}</p>
                <div className="flex flex-wrap gap-1.5">
                    {tool.chips.map((chip) => (
                        <Chip key={chip.text} chip={chip} />
                    ))}
                </div>
                <div className="flex gap-2 rounded-lg bg-muted/40 p-3">
                    <Lightbulb className="mt-0.5 size-4 shrink-0 text-amber-500" />
                    <p className="text-[13.5px] leading-normal">
                        <strong className="font-semibold">Idea:</strong> {tool.idea}
                    </p>
                </div>
                <div className="mt-auto grid grid-cols-2 gap-2 pt-0.5">
                    <button
                        type="button"
                        onClick={onFirstTime}
                        className={cn(
                            "inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-primary/10 text-sm font-semibold transition-colors hover:bg-primary/15 md:h-10",
                            PRIMARY_TEXT
                        )}
                    >
                        <Compass className="size-4" />
                        ¿Primera vez?
                    </button>
                    <a
                        href={tool.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Abrir ${tool.name} en otra pestaña`}
                        className="inline-flex h-11 items-center justify-center gap-1.5 rounded-lg border border-border bg-card text-sm font-medium text-foreground transition-colors hover:bg-muted/40 md:h-10"
                    >
                        Abrir
                        <ExternalLink className="size-[15px]" />
                    </a>
                </div>
            </div>
        </Card>
    );
}

function Chip({ chip }: { chip: ToolChip }) {
    if (chip.caution) {
        return (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-400">
                <Eye className="size-3" strokeWidth={2.2} />
                {chip.text}
            </span>
        );
    }
    return (
        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            {chip.text}
        </span>
    );
}

/**
 * La guía de «¿Primera vez?». Va dentro del `Dialog` compartido, que no tiene
 * alto máximo: la guía lo limita a la pantalla, desplaza el contenido por dentro
 * y deja fijos arriba el título y abajo «Cerrar» y «Abrir», que en el celular
 * quedan siempre a mano.
 */
function ToolGuide({ tool, onClose }: { tool: Tool; onClose: () => void }) {
    const { Icon, iconBox, band } = GROUP_STYLE[tool.group];
    const titleId = `guia-${tool.id}`;
    const { guide } = tool;

    return (
        <div role="dialog" aria-modal="true" aria-labelledby={titleId} className="flex min-h-0 flex-1 flex-col">
            <div className="flex shrink-0 items-start gap-3 border-b border-border/60 py-4 pl-4 pr-2.5 sm:gap-3.5 sm:px-7 sm:py-5">
                <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-xl sm:size-11", iconBox)}>
                    <Icon className="size-5 sm:size-[22px]" />
                </span>
                <div className="min-w-0 flex-1 space-y-0.5">
                    <h2 id={titleId} className="text-lg font-bold leading-snug tracking-tight sm:text-[22px]">
                        Primera vez con {tool.name}
                    </h2>
                    <p className={cn("text-[12.5px] sm:text-[13px]", MUTED)}>
                        {tool.domain} · {tool.plan}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    autoFocus
                    aria-label="Cerrar"
                    className={cn("-mt-1 flex size-11 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-muted/50 sm:size-9", MUTED)}
                >
                    <X className="size-5" />
                </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
                <div className="flex flex-col gap-5 px-4 py-4 sm:px-7 sm:py-5">
                    <div
                        aria-hidden="true"
                        className={cn(
                            "shrink-0 rounded-xl",
                            band,
                            tool.id === "wordwall" ? "p-3 sm:px-4 sm:py-3.5" : "flex h-[136px] items-center justify-center sm:h-[150px]"
                        )}
                    >
                        {tool.id === "wordwall" ? <WordwallGamesSketch /> : <ToolSketch id={tool.id} />}
                    </div>

                    <p className="text-[15px] leading-relaxed">{guide.about}</p>

                    <section className="space-y-3">
                        <h3 className="text-base font-bold">Arrancá en tres pasos</h3>
                        <ol className="space-y-2.5">
                            {guide.steps.map((step, i) => (
                                <li key={step.lead} className="flex items-start gap-2.5 sm:gap-3">
                                    <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[12.5px] font-bold sm:size-[26px] sm:text-[13px]", PRIMARY_TEXT)}>
                                        {i + 1}
                                    </span>
                                    <p className="pt-px text-[14.5px] leading-normal">
                                        <strong className="font-semibold">{step.lead}</strong> {step.rest}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    </section>

                    <section className="space-y-2.5">
                        <h3 className="text-base font-bold">Bueno saber</h3>
                        <ul className="space-y-2">
                            {guide.goodToKnow.map((item) => (
                                <li key={item} className="flex items-start gap-2.5 text-sm leading-normal">
                                    <Check className="mt-[3px] size-4 shrink-0 text-emerald-600" strokeWidth={2.4} />
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </section>

                    <div className="flex gap-3 rounded-xl bg-muted/40 p-3.5 sm:p-4">
                        <Lightbulb className="mt-px size-5 shrink-0 text-amber-500" />
                        <div className="space-y-1">
                            <p className="text-xs font-bold uppercase tracking-wide text-neutral-600 dark:text-muted-foreground">
                                Idea para tu próxima clase
                            </p>
                            <p className="text-[14.5px] leading-normal">{guide.idea}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-border/60 px-4 py-3 sm:flex sm:justify-end sm:px-7 sm:py-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="h-11 rounded-md border border-border bg-card px-4 text-sm font-medium transition-colors hover:bg-muted/40 sm:h-10"
                >
                    Cerrar
                </button>
                <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn("inline-flex h-11 items-center justify-center gap-1.5 rounded-md px-4 text-sm font-medium transition-colors sm:h-10", PRIMARY_BUTTON)}
                >
                    Abrir {tool.name}
                    <ExternalLink className="size-[15px]" />
                </a>
            </div>
        </div>
    );
}
