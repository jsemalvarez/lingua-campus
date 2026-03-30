import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { ShieldCheck, FileKey, Zap, PieChart, GraduationCap, Undo2, ArrowLeft, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function FinanceTourPage() {
    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />

            <div className="bg-emerald-900 absolute top-0 left-0 w-full h-[500px] -z-10" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 80%, 0% 100%)' }}>
                <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
            </div>

            <main className="container mx-auto px-4 sm:px-6 pt-16 animate-in fade-in slide-in-from-bottom-8 duration-700">
                
                <header className="mb-16 text-center max-w-3xl mx-auto block">
                    <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-sm font-semibold tracking-wide uppercase">
                        <ShieldCheck size={16} /> Presentación Oficial
                    </div>
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white mb-6">
                        El Motor Financiero <br className="hidden md:block"/> de Lingua Campus
                    </h1>
                    <p className="text-lg md:text-xl text-emerald-100/80 mb-8 leading-relaxed">
                        Un sistema contable blindado, inmutable y diseñado específicamente para la agilidad de los institutos educativos modernos. Descubre cómo transformamos la complejidad administrativa en tranquilidad.
                    </p>
                    <Link href="/payments">
                        <Button className="bg-white text-emerald-900 hover:bg-emerald-50 font-bold px-8 shadow-xl shadow-emerald-900/20">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Finanzas
                        </Button>
                    </Link>
                </header>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* Feature 1 */}
                    <Card className="p-8 border-border/40 hover:border-emerald-500/50 transition-colors shadow-lg bg-card/60 backdrop-blur-sm group overflow-hidden relative">
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-colors" />
                        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-6 text-blue-500 group-hover:scale-110 transition-transform">
                            <FileKey size={28} />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">Libro Mayor Inmutable</h3>
                        <p className="text-muted-foreground leading-relaxed mb-6">
                            Protegemos la integridad de tus datos contables a nivel bancario. A diferencia de sistemas tradicionales donde los registros se pueden borrar accidentalmente, Lingua Campus utiliza un <strong className="text-foreground">Ledger inmutable</strong>. Todo movimiento (ingreso, gasto, sueldo) queda grabado permanentemente.
                        </p>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Auditoría perfecta (Cero pérdidas de datos)</li>
                            <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Trazabilidad de operador (quién cobró qué y cuándo)</li>
                        </ul>
                    </Card>

                    {/* Feature 2 */}
                    <Card className="p-8 border-border/40 hover:border-amber-500/50 transition-colors shadow-lg bg-card/60 backdrop-blur-sm group overflow-hidden relative">
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-colors" />
                        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-6 text-amber-500 group-hover:scale-110 transition-transform">
                            <Undo2 size={28} />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">Errores Humanos Resueltos</h3>
                        <p className="text-muted-foreground leading-relaxed mb-6">
                            ¿Alguien cobró una cuota con el monto equivocado? No hay problema. Hemos diseñado un flujo de <strong className="text-foreground">Anulación de Recibos</strong> que revierte el efecto financiero mediante un contra-asiento automático (un reembolso contable), exigiendo un <i>motivo de anulación</i> para dejar constancia escrita.
                        </p>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> El saldo del alumno vuelve a estar pendiente</li>
                            <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Reparación instantánea en la caja del mes</li>
                        </ul>
                    </Card>

                    {/* Feature 3 */}
                    <Card className="p-8 border-border/40 hover:border-rose-500/50 transition-colors shadow-lg bg-card/60 backdrop-blur-sm group overflow-hidden relative">
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-colors" />
                        <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-6 text-rose-500 group-hover:scale-110 transition-transform">
                            <Zap size={28} />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">Facturación Masiva y Ágil</h3>
                        <p className="text-muted-foreground leading-relaxed mb-6">
                            Genera deudores en solo dos clics. ¿Empieza un nuevo año? Aplica el <strong className="text-foreground">Generador de Matrículas</strong> para crear las inscripciones anuales de todos los alumnos activos en un segundo. ¿Cambió el mes? Genera y distribuye cobros con la tranquilidad de que el algoritmo no duplicará deudas existentes.
                        </p>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Ahorro masivo de tiempo administrativo</li>
                            <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Edición posterior de cuotas no cobradas</li>
                        </ul>
                    </Card>

                    {/* Feature 4 */}
                    <Card className="p-8 border-border/40 hover:border-purple-500/50 transition-colors shadow-lg bg-card/60 backdrop-blur-sm group overflow-hidden relative">
                        <div className="absolute -right-8 -top-8 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-colors" />
                        <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-6 text-purple-500 group-hover:scale-110 transition-transform">
                            <PieChart size={28} />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">KPIs y Reportes de Mora</h3>
                        <p className="text-muted-foreground leading-relaxed mb-6">
                            El módulo no solo guarda datos, te da inteligencia. Un <strong className="text-foreground">Reporte de Deudores</strong> avanzado te muestra quién debe cuánto y desde cuándo. El panel cruza automáticamente ingresos operativos, nóminas de sueldos y cuotas para ofrecerte la rentabilidad neta en tiempo real.
                        </p>
                        <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Desglose detallado de rentabilidad</li>
                            <li className="flex items-center gap-2"><CheckCircle2 size={16} className="text-emerald-500" /> Cálculo dinámico separado de Anulaciones</li>
                        </ul>
                    </Card>
                </div>

                <div className="mt-16 max-w-4xl mx-auto bg-gradient-to-br from-emerald-900 to-teal-950 rounded-3xl p-8 md:p-12 text-center shadow-2xl overflow-hidden relative border border-emerald-500/20">
                    <div className="absolute top-0 right-0 opacity-10">
                        <GraduationCap size={400} className="-mr-20 -mt-20" />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-3xl font-bold text-white mb-4">Listo para escalar</h2>
                        <p className="text-emerald-100/80 mb-8 max-w-2xl mx-auto text-lg">
                            Esta flexibilidad financiera preparará a las academias para crecer de 50 alumnos a más de 500, estandarizando sus cobros y blindando su tesorería frente a errores humanos.
                        </p>
                        <Link href="/payments">
                            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 font-bold px-8 rounded-full">
                                Probar el Sistema Financiero
                            </Button>
                        </Link>
                    </div>
                </div>

            </main>
        </div>
    );
}
