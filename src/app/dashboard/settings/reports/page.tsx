import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { INSTITUTE_ADMINS, requireRole } from "@/lib/authz";
import { ReportTemplateManager } from "@/features/reports/ReportTemplateManager";
import { ClipboardList, ChevronRight, PenLine } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default async function ReportTemplatesPage() {
    const auth = await requireRole(INSTITUTE_ADMINS);
    if (!auth) redirect("/dashboard");

    const activeRole = auth.activeRole;

    return (
        <div className="min-h-screen bg-background">
            <Navbar currentActiveRole={activeRole} />
            <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">

                {/* Breadcrumbs / Header */}
                <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                    <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <Link href="/dashboard" className="hover:text-primary transition-colors">Dashboard</Link>
                            <ChevronRight size={12} />
                            <span>Configuración</span>
                            <ChevronRight size={12} />
                            <span className="text-foreground">Plantillas de Informes</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                                <ClipboardList size={24} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold tracking-tight">Plantillas de Informes</h1>
                                <p className="text-muted-foreground text-sm font-medium">
                                    Diseñá los modelos de informe que los profesores usarán para cargar notas.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Link href="/reports/signatures">
                            <Button
                                variant="outline"
                                className="flex items-center gap-2 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                            >
                                <PenLine size={16} />
                                Firmas de los informes
                            </Button>
                        </Link>
                    </div>
                </header>

                <ReportTemplateManager />
            </div>
        </div>
    );
}
