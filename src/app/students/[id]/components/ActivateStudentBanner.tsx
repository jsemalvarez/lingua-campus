"use client";

import { useTransition } from "react";
import { activateStudentAction } from "../../actions/activate";
import { Button } from "@/components/ui/Button";
import { UserCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

export function ActivateStudentBanner({ studentId, studentName }: { studentId: string; studentName: string }) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const handleActivate = () => {
        startTransition(async () => {
            const res = await activateStudentAction(studentId);
            if (res.success) {
                router.refresh();
            } else {
                alert(res.error || "Ocurrió un error");
            }
        });
    };

    return (
        <div className="mb-8 p-6 rounded-[2rem] bg-gradient-to-r from-primary/10 via-primary/5 to-emerald-500/5 border border-primary/20 shadow-xl shadow-primary/5 animate-in fade-in slide-in-from-top-4 duration-700 overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 text-primary/10 group-hover:scale-110 transition-transform duration-500">
                <Sparkles size={120} />
            </div>
            
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                        <UserCheck className="text-primary" /> Nuevo Interesado
                    </h2>
                    <p className="text-muted-foreground max-w-lg">
                        <strong>{studentName}</strong> se ha pre-inscripto a través del formulario web. 
                        Revisá sus datos y activalo para que forme parte oficial del instituto.
                    </p>
                </div>
                
                <Button 
                    onClick={handleActivate} 
                    disabled={isPending}
                    className="premium-gradient h-12 px-8 font-bold shadow-lg shadow-primary/20 hover:scale-[1.03] transition-all rounded-2xl w-full md:w-auto"
                >
                    {isPending ? "Activando..." : "Confirmar y Activar Alumno"}
                </Button>
            </div>
        </div>
    );
}
