"use client";

import { useTransition } from "react";
import { toggleExamRegistrationAction } from "@/app/enrollments/actions";
import { FileText, Loader2, Check } from "lucide-react";

interface Props {
    enrollmentId: string;
    takesExam: boolean;
    isAdmin: boolean;
}

export function ExamRegistrationToggle({ enrollmentId, takesExam, isAdmin }: Props) {
    const [isPending, startTransition] = useTransition();

    const handleToggle = () => {
        if (!isAdmin) return; // Only prevent action from UI, server will also validate
        startTransition(async () => {
            const res = await toggleExamRegistrationAction(enrollmentId, !takesExam);
            if (!res.success) {
                alert(res.error);
            }
        });
    };

    return (
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg transition-colors ${takesExam ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400' : 'bg-muted/50 text-muted-foreground'}`}>
                    <FileText size={18} />
                </div>
                <div>
                    <p className="text-sm font-bold leading-none">Examen Final</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                        {takesExam ? "Inscrito para rendir a fin de año" : "No está inscrito para el examen"}
                    </p>
                </div>
            </div>
            {isAdmin && (
                <button
                    type="button"
                    onClick={handleToggle}
                    disabled={isPending}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 ${takesExam ? 'bg-purple-600' : 'bg-muted-foreground/30'} ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                    role="switch"
                    aria-checked={takesExam}
                >
                    <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center ${takesExam ? 'translate-x-5' : 'translate-x-0'}`}
                    >
                        {isPending && <Loader2 size={12} className="animate-spin text-muted-foreground" />}
                        {!isPending && takesExam && <Check size={12} className="text-purple-600" />}
                    </span>
                </button>
            )}
        </div>
    );
}
