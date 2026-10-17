"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { setCourseExamRegistrationsAction } from "@/app/enrollments/actions";
import { formatCurrency } from "@/lib/utils";

interface ExamEnrollment {
    id: string;
    studentName: string;
    takesExam: boolean;
    customExamPrice: number | null;
}

interface Props {
    courseId: string;
    examPrice: number;
    /** `YYYY-MM-DD`, o null si el curso todavía no tiene fecha de examen. */
    examDate: string | null;
    enrollments: ExamEnrollment[];
}

/**
 * El examen final de todo el curso en una sola pantalla. Rinden casi todos: si
 * el curso todavía no tiene a nadie anotado, arranca con todos tildados; si ya
 * se cargó, muestra cómo quedó.
 */
export function CourseExamModal({ courseId, examPrice, examDate, enrollments }: Props) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);

    const alreadyLoaded = enrollments.some(e => e.takesExam);
    const initialSelection = () => new Set(enrollments.filter(e => !alreadyLoaded || e.takesExam).map(e => e.id));
    const [selected, setSelected] = useState<Set<string>>(initialSelection);

    const priceOf = (e: ExamEnrollment) => e.customExamPrice ?? examPrice;
    const taking = enrollments.filter(e => selected.has(e.id));
    const total = taking.reduce((sum, e) => sum + priceOf(e), 0);
    const year = new Date().getFullYear();
    // Se arma a mano y no con `Date`: la fecha viene a medianoche UTC y, leída en
    // hora de Argentina, caería el día anterior.
    const examDateLabel = examDate ? examDate.split("-").reverse().join("/") : null;

    const handleOpenChange = (next: boolean) => {
        if (next) {
            setSelected(initialSelection());
            setError(null);
        }
        if (!isPending) setOpen(next);
    };

    const toggle = (id: string) => {
        setSelected(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleConfirm = () => {
        setError(null);
        startTransition(async () => {
            const res = await setCourseExamRegistrationsAction(courseId, [...selected]);
            if (res.success) {
                setOpen(false);
                router.refresh();
            } else {
                setError(res.error || "No se pudo cargar el examen final");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <button
                type="button"
                onClick={() => handleOpenChange(true)}
                className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-400 font-semibold text-sm rounded-lg transition-colors cursor-pointer text-center whitespace-nowrap flex items-center justify-center gap-1.5"
            >
                <FileText size={15} />
                Examen final
            </button>

            <DialogContent className="flex max-h-[calc(100dvh-2rem)] flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText size={18} className="text-purple-600 dark:text-purple-400" />
                        Examen final {year}
                    </DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Destildá a los alumnos que no rinden. A cada alumno que rinde se le emite el derecho de examen.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        {examDateLabel
                            ? <>Se rinde el <strong className="text-foreground">{examDateLabel}</strong>. Hasta ese día, las familias ven el derecho de examen como un pago futuro.</>
                            : <>El curso todavía no tiene fecha de examen. Las familias ven el derecho de examen como un pago futuro, y la clase del examen aparece en el libro de temas cuando se carga la fecha en «Editar curso».</>}
                    </p>
                </DialogHeader>

                {examPrice === 0 && (
                    <p className="mb-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                        El curso no tiene precio de examen: los alumnos quedan anotados para rendir, sin cuota, salvo los que tengan un precio propio.
                    </p>
                )}

                <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-semibold text-muted-foreground">
                        Rinden {taking.length} de {enrollments.length}
                    </span>
                    <div className="flex gap-3">
                        <button type="button" className="font-semibold text-primary hover:underline" onClick={() => setSelected(new Set(enrollments.map(e => e.id)))}>
                            Todos
                        </button>
                        <button type="button" className="font-semibold text-primary hover:underline" onClick={() => setSelected(new Set())}>
                            Ninguno
                        </button>
                    </div>
                </div>

                <div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1 custom-scrollbar">
                    {enrollments.map(e => {
                        const checked = selected.has(e.id);
                        return (
                            <label
                                key={e.id}
                                className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-3 py-2 transition-colors ${checked ? "border-purple-500/30 bg-purple-500/5" : "border-border/50 opacity-70 hover:bg-muted/30"}`}
                            >
                                <span className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggle(e.id)}
                                        className="h-4 w-4 accent-purple-600"
                                    />
                                    <span className="text-sm font-semibold">{e.studentName}</span>
                                </span>
                                <span className="text-xs text-muted-foreground whitespace-nowrap">
                                    {e.customExamPrice !== null && <span className="mr-1 text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400">Precio propio</span>}
                                    ${formatCurrency(priceOf(e))}
                                </span>
                            </label>
                        );
                    })}
                </div>

                {error && <p className="mt-3 text-sm font-medium text-red-600">{error}</p>}

                <DialogFooter className="items-center gap-2 sm:space-x-0">
                    <span className="mr-auto text-sm text-muted-foreground">
                        Total del examen: <strong className="text-foreground">${formatCurrency(total)}</strong>
                    </span>
                    <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={isPending}>
                        Cancelar
                    </Button>
                    <Button onClick={handleConfirm} disabled={isPending}>
                        {isPending ? <Loader2 size={16} className="animate-spin" /> : "Confirmar"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
