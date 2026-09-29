import type { ReactNode } from "react";
import { Heart, Image as ImageIcon, Mic, Music, Play, Plus, RotateCcw, Square, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ToolId } from "../tools";

/**
 * Dibujos de lo que ven los alumnos en cada herramienta. Son esquemas propios, no
 * capturas: alcanzan para que quien no la conoce se dé una idea de un vistazo.
 * Llevan colores fijos, como una captura, y son decorativos (`aria-hidden` en el
 * contenedor que los recibe): el texto de la tarjeta dice lo mismo.
 */
export function ToolSketch({ id }: { id: ToolId }) {
    switch (id) {
        case "kahoot": return <KahootSketch />;
        case "wordwall": return <WordwallSketch />;
        case "quizlet": return <QuizletSketch />;
        case "youglish": return <YouglishSketch />;
        case "playphrase": return <PlayphraseSketch />;
        case "lingoclip": return <LingoclipSketch />;
        case "canva": return <CanvaSketch />;
        case "docs": return <DocsSketch />;
        case "padlet": return <PadletSketch />;
    }
}

/** La guía de Wordwall muestra lo que la distingue: las mismas palabras en tres juegos. */
export function WordwallGamesSketch() {
    return (
        <div className="flex flex-col gap-2.5">
            <span className="text-[13px] font-semibold text-orange-700 dark:text-orange-300">
                Las mismas palabras, tres juegos distintos
            </span>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <MiniGame label="Ruleta"><Wheel className="h-[57px] w-[52px]" bold /></MiniGame>
                <MiniGame label="Unir"><MatchUp /></MiniGame>
                <MiniGame label="Anagrama"><Anagram /></MiniGame>
            </div>
        </div>
    );
}

function MiniGame({ label, children }: { label: string; children: ReactNode }) {
    return (
        <div className="flex h-[100px] flex-col items-center justify-center gap-1.5 rounded-[10px] bg-white sm:h-28">
            {children}
            <span className="text-xs font-semibold text-zinc-700">{label}</span>
        </div>
    );
}

const KAHOOT_TILE = "flex h-8 items-center justify-center rounded-md text-[12.5px] font-bold";

function KahootSketch() {
    return (
        <div className="flex w-[244px] flex-col gap-2">
            <div className="flex h-10 items-center justify-between gap-2 rounded-lg bg-white pl-3 pr-2 shadow-sm">
                <span className="whitespace-nowrap text-[11.5px] font-semibold text-zinc-700">Which animal has a long neck?</span>
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[11px] font-bold text-white">12</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
                <span className={cn(KAHOOT_TILE, "bg-red-600 text-white")}>lion</span>
                <span className={cn(KAHOOT_TILE, "bg-blue-600 text-white")}>giraffe</span>
                <span className={cn(KAHOOT_TILE, "bg-amber-400 text-amber-950")}>zebra</span>
                <span className={cn(KAHOOT_TILE, "bg-emerald-700 text-white")}>hippo</span>
            </div>
        </div>
    );
}

const WHEEL_SEGMENTS = [
    { d: "M55 55 L55 5 A50 50 0 0 1 98.3 30 Z", fill: "#ef4444" },
    { d: "M55 55 L98.3 30 A50 50 0 0 1 98.3 80 Z", fill: "#fbbf24" },
    { d: "M55 55 L98.3 80 A50 50 0 0 1 55 105 Z", fill: "#3b82f6" },
    { d: "M55 55 L55 105 A50 50 0 0 1 11.7 80 Z", fill: "#10b981" },
    { d: "M55 55 L11.7 80 A50 50 0 0 1 11.7 30 Z", fill: "#a855f7" },
    { d: "M55 55 L11.7 30 A50 50 0 0 1 55 5 Z", fill: "#ffffff" },
];

/** La ruleta de Wordwall. `bold` engrosa los trazos para cuando se dibuja chica. */
function Wheel({ className, bold = false }: { className?: string; bold?: boolean }) {
    const line = bold ? 4 : 2.5;
    return (
        <svg viewBox="0 -10 110 120" className={className} aria-hidden="true">
            {WHEEL_SEGMENTS.map((s) => (
                <path key={s.d} d={s.d} fill={s.fill} stroke="#ffffff" strokeWidth={bold ? 3 : 2} strokeLinejoin="round" />
            ))}
            <circle cx="55" cy="55" r="50" fill="none" stroke="#3f3f46" strokeWidth={line} />
            <circle cx="55" cy="55" r={bold ? 9 : 7} fill="#ffffff" stroke="#3f3f46" strokeWidth={line} />
            <path
                d={bold ? "M45 -9 L65 -9 L55 7 Z" : "M47 -9 L63 -9 L55 6 Z"}
                fill="#3f3f46"
                stroke="#3f3f46"
                strokeWidth={bold ? 3 : 2}
                strokeLinejoin="round"
            />
        </svg>
    );
}

const WORD_TILE = "rounded-md bg-white px-3.5 py-1.5 text-[13px] font-semibold text-zinc-700 shadow-sm";

function WordwallSketch() {
    return (
        <div className="flex items-center gap-[22px]">
            <Wheel className="h-[113px] w-[104px]" />
            <div className="flex flex-col items-start gap-2">
                <span className={cn(WORD_TILE, "-rotate-3")}>cat</span>
                <span className={cn(WORD_TILE, "rotate-2")}>dog</span>
                <span className={cn(WORD_TILE, "-rotate-[1.5deg]")}>bird</span>
            </div>
        </div>
    );
}

function MatchUp() {
    return (
        <svg viewBox="0 0 118 66" className="w-[88px] sm:w-[110px]" aria-hidden="true">
            <line x1="44" y1="15" x2="72" y2="51" stroke="#3f3f46" strokeWidth="2" strokeLinecap="round" />
            <line x1="44" y1="51" x2="72" y2="15" stroke="#3f3f46" strokeWidth="2" strokeLinecap="round" />
            <rect x="2" y="5" width="42" height="20" rx="6" fill="#fafafa" stroke="#3f3f46" strokeWidth="1.5" />
            <text x="23" y="19" textAnchor="middle" fontSize="11" fontWeight="700" fill="#3f3f46">cat</text>
            <rect x="2" y="41" width="42" height="20" rx="6" fill="#fafafa" stroke="#3f3f46" strokeWidth="1.5" />
            <text x="23" y="55" textAnchor="middle" fontSize="11" fontWeight="700" fill="#3f3f46">dog</text>
            <rect x="72" y="5" width="44" height="20" rx="6" fill="#fde68a" />
            <text x="94" y="19" textAnchor="middle" fontSize="11" fontWeight="700" fill="#3f3f46">perro</text>
            <rect x="72" y="41" width="44" height="20" rx="6" fill="#bfdbfe" />
            <text x="94" y="55" textAnchor="middle" fontSize="11" fontWeight="700" fill="#3f3f46">gato</text>
        </svg>
    );
}

const LETTER = "flex h-5 w-[19px] items-center justify-center rounded text-[11px] font-bold";

function Anagram() {
    return (
        <div className="flex flex-col items-center gap-[3px]">
            <div className="flex gap-[3px]">
                <span className={cn(LETTER, "-rotate-6 bg-amber-400 text-zinc-700")}>T</span>
                <span className={cn(LETTER, "rotate-[5deg] bg-blue-200 text-zinc-700")}>A</span>
                <span className={cn(LETTER, "-rotate-3 bg-red-200 text-zinc-700")}>C</span>
            </div>
            <svg viewBox="0 0 24 24" className="size-3" fill="none" stroke="#3f3f46" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5v14" />
                <path d="m19 12-7 7-7-7" />
            </svg>
            <div className="flex gap-[3px]">
                <span className={cn(LETTER, "bg-zinc-700 text-white")}>C</span>
                <span className={cn(LETTER, "bg-zinc-700 text-white")}>A</span>
                <span className={cn(LETTER, "bg-zinc-700 text-white")}>T</span>
            </div>
        </div>
    );
}

const FLASHCARD = "flex h-[76px] w-[108px] items-center justify-center rounded-[10px] bg-white shadow-md";

function QuizletSketch() {
    return (
        <div className="flex flex-col items-center gap-3.5">
            <div className="flex items-center gap-2">
                <div className={cn(FLASHCARD, "-rotate-3")}>
                    <span className="text-xl font-extrabold tracking-tight text-zinc-700">giraffe</span>
                </div>
                <RotateCcw className="size-[22px] text-orange-600" strokeWidth={2.4} />
                <div className={cn(FLASHCARD, "rotate-3")}>
                    <span className="text-base font-semibold text-zinc-500">jirafa</span>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <span className="flex h-1.5 w-[120px] overflow-hidden rounded-full bg-white/90">
                    <span className="w-1/4 rounded-full bg-orange-500" />
                </span>
                <span className="text-[11.5px] font-bold text-orange-700">3 / 12</span>
            </div>
        </div>
    );
}

const ACCENT = "flex h-[26px] w-10 items-center justify-center rounded-md text-[11.5px] font-bold";

function YouglishSketch() {
    return (
        <div className="flex items-center gap-3">
            <div className="relative h-[110px] w-[196px] overflow-hidden rounded-[10px] bg-zinc-800">
                <span className="absolute left-[81px] top-6 flex size-[34px] items-center justify-center rounded-full bg-white/20">
                    <Play className="size-3.5 fill-white text-white" />
                </span>
                <span className="absolute inset-x-2 bottom-[11px] whitespace-nowrap text-center text-[11.5px] font-medium text-white">
                    …and I <span className="rounded bg-amber-400 px-1 font-bold text-zinc-800">thought</span> it was…
                </span>
            </div>
            <div className="flex flex-col gap-1.5">
                <span className={cn(ACCENT, "bg-blue-600 text-white")}>US</span>
                <span className={cn(ACCENT, "bg-white text-zinc-700")}>UK</span>
                <span className={cn(ACCENT, "bg-white text-zinc-700")}>AU</span>
            </div>
        </div>
    );
}

function Sprockets() {
    return (
        <div className="flex justify-between">
            {Array.from({ length: 12 }, (_, i) => (
                <span key={i} className="h-[5px] w-2 rounded-[1.5px] bg-white/50" />
            ))}
        </div>
    );
}

function PlayphraseSketch() {
    return (
        <div className="flex flex-col items-center gap-2.5">
            <div className="flex h-[78px] w-[250px] flex-col justify-between rounded-md bg-zinc-800 px-2 py-[5px]">
                <Sprockets />
                <div className="flex items-center justify-center gap-2">
                    <span className="h-11 w-[62px] rounded bg-zinc-700" />
                    <span className="flex h-[50px] w-[88px] items-center justify-center rounded bg-blue-400">
                        <Play className="size-3.5 fill-blue-900 text-blue-900" />
                    </span>
                    <span className="h-11 w-[62px] rounded bg-zinc-700" />
                </div>
                <Sprockets />
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-zinc-700">“How are you doing?”</span>
                <span className="rounded-full bg-white px-2 py-[3px] text-[11px] font-bold text-blue-700">4 / 5</span>
            </div>
        </div>
    );
}

const LYRIC_LINE = "flex items-center gap-[5px] whitespace-nowrap text-[12.5px] font-medium text-zinc-700";

function LingoclipSketch() {
    return (
        <div className="flex w-[250px] flex-col gap-2 rounded-[10px] bg-white px-3.5 py-3 shadow-sm">
            <div className="flex items-center gap-2">
                <Music className="size-3.5 text-blue-600" strokeWidth={2.4} />
                <span className="flex h-[5px] flex-1 overflow-hidden rounded-full bg-blue-100">
                    <span className="w-[45%] rounded-full bg-blue-600" />
                </span>
                <span className="text-[10.5px] font-semibold text-zinc-500">1:12</span>
            </div>
            <div className={LYRIC_LINE}>
                <span>We walk along the</span>
                <span className="rounded-md bg-emerald-100 px-1.5 py-px font-bold text-emerald-700">river</span>
            </div>
            <div className={LYRIC_LINE}>
                <span>under the</span>
                <span className="h-3.5 w-[46px] border-b-2 border-dashed border-blue-600" />
                <span>and the stars</span>
            </div>
            <div className="flex gap-1.5">
                {["moon", "rain", "sea"].map((word) => (
                    <span key={word} className="rounded-full bg-zinc-100 px-[9px] py-[3px] text-[11px] font-semibold text-zinc-700">{word}</span>
                ))}
            </div>
        </div>
    );
}

const HANDLE = "absolute size-[7px] border-[1.5px] border-purple-600 bg-white";

function CanvaSketch() {
    return (
        <div className="flex items-center gap-2.5">
            <div className="flex flex-col gap-1.5">
                {[Type, Square, ImageIcon].map((Icon, i) => (
                    <span key={i} className="flex size-7 items-center justify-center rounded-md bg-white text-purple-700">
                        <Icon className="size-3.5" strokeWidth={2.4} />
                    </span>
                ))}
            </div>
            <div className="flex h-[108px] w-[168px] items-center justify-center gap-3.5 rounded-[10px] bg-white shadow-md">
                <span className="size-11 rounded-full bg-amber-400 ring-[6px] ring-amber-400/30" />
                <span className="relative border-[1.5px] border-purple-600 px-1.5 py-0.5 text-[25px] font-extrabold leading-tight tracking-tight text-zinc-700">
                    SUN
                    <span className={cn(HANDLE, "-left-1 -top-1")} />
                    <span className={cn(HANDLE, "-right-1 -top-1")} />
                    <span className={cn(HANDLE, "-bottom-1 -left-1")} />
                    <span className={cn(HANDLE, "-bottom-1 -right-1")} />
                </span>
            </div>
            <div className="flex flex-col gap-1.5">
                {["bg-red-500", "bg-amber-400", "bg-blue-500", "bg-emerald-500"].map((color) => (
                    <span key={color} className={cn("size-4 rounded-full", color)} />
                ))}
            </div>
        </div>
    );
}

/** Cursor de otra persona escribiendo, con su nombre arriba, como en un documento compartido. */
function Caret({ name, color, className }: { name: string; color: string; className?: string }) {
    return (
        <span className={cn("relative h-3.5 w-0.5", color, className)}>
            <span className={cn("absolute bottom-3.5 left-0 rounded-[4px_4px_4px_0] px-[5px] py-px text-[9px] font-bold text-white", color)}>
                {name}
            </span>
        </span>
    );
}

function DocsSketch() {
    return (
        <div className="relative h-[108px] w-[254px]">
            <div className="absolute left-0 top-0 flex h-[108px] w-[192px] flex-col gap-[9px] rounded-md bg-white px-3.5 pb-3 pt-4 shadow-sm">
                <span className="whitespace-nowrap text-[11px] font-semibold text-zinc-700">Once upon a time, a little fox</span>
                <div className="flex items-center whitespace-nowrap text-[11px] font-semibold text-zinc-700">
                    <span>lived near the</span>
                    <Caret name="Sofi" color="bg-violet-600" className="ml-[3px]" />
                </div>
                <span className="h-[7px] w-[88%] rounded-full bg-zinc-200" />
                <div className="flex items-center gap-[3px]">
                    <span className="h-[7px] w-[52%] rounded-full bg-zinc-200" />
                    <Caret name="Tomi" color="bg-orange-700" />
                </div>
            </div>
            <div className="absolute right-0 top-[18px] flex w-[72px] flex-col gap-1 rounded-lg bg-amber-100 px-2 py-[7px] shadow-md">
                <span className="flex items-center gap-1 text-[9.5px] font-bold text-amber-800">
                    <span className="size-3 rounded-full bg-primary" />Profe
                </span>
                <span className="text-[10.5px] font-semibold text-zinc-700">Nice! Now add an adjective.</span>
            </div>
        </div>
    );
}

/** Renglones de texto de una nota del muro, en gris. */
function Lines({ widths, tone = "bg-zinc-300" }: { widths: string[]; tone?: string }) {
    return (
        <>
            {widths.map((width, i) => (
                <span key={i} className={cn("h-[5px] rounded-full", tone)} style={{ width }} />
            ))}
        </>
    );
}

const NOTE = "flex flex-col gap-[5px] rounded-md p-2";

function PadletSketch() {
    return (
        <div className="flex w-[232px] flex-col gap-2">
            <div className="flex items-center justify-between">
                <span className="text-sm font-bold tracking-tight text-zinc-700">My weekend</span>
                <span className="flex size-[22px] items-center justify-center rounded-full bg-[#23806a] text-white">
                    <Plus className="size-3" strokeWidth={3} />
                </span>
            </div>
            <div className="grid grid-cols-3 items-start gap-[7px]">
                <div className="flex flex-col gap-[7px]">
                    <div className={cn(NOTE, "h-11 bg-white")}><Lines widths={["90%", "70%", "80%"]} /></div>
                    <div className="flex h-9 items-center gap-[5px] rounded-md bg-amber-300 px-2 text-amber-950">
                        <Mic className="size-3" strokeWidth={2.6} />
                        {[8, 14, 6, 12].map((height, i) => (
                            <span key={i} className="w-[3px] rounded-sm bg-amber-950" style={{ height }} />
                        ))}
                    </div>
                </div>
                <div className="flex flex-col gap-[7px]">
                    <div className="flex h-[60px] flex-col gap-[5px] rounded-md bg-white p-[5px]">
                        <span className="flex h-[34px] items-center justify-center rounded bg-blue-200 text-blue-700">
                            <ImageIcon className="size-3.5" strokeWidth={2.4} />
                        </span>
                        <span className="h-[5px] w-3/4 rounded-full bg-zinc-300" />
                    </div>
                    <div className="flex h-[26px] items-center gap-1 rounded-md bg-rose-100 px-2 text-[10.5px] font-bold text-rose-600">
                        <Heart className="size-[11px] fill-current" strokeWidth={0} />3
                    </div>
                </div>
                <div className="flex flex-col gap-[7px]">
                    <div className={cn(NOTE, "h-[34px] bg-purple-100")}><Lines widths={["85%", "60%"]} tone="bg-purple-300" /></div>
                    <div className={cn(NOTE, "h-[52px] bg-white")}><Lines widths={["90%", "75%", "85%", "50%"]} /></div>
                </div>
            </div>
        </div>
    );
}
