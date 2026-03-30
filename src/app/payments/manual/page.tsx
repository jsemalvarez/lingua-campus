import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { BookOpen, CalendarPlus, Wand2, ShieldAlert, Undo2, ArrowLeft, Trash2, Edit2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function FinanceManualPage() {
    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />

            <main className="container mx-auto px-4 sm:px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl">
                
                <header className="mb-10 block border-b border-border/40 pb-8">
                    <Link href="/payments">
                        <Button variant="ghost" className="mb-4 -ml-4 text-muted-foreground hover:text-primary">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Finanzas
                        </Button>
                    </Link>
                    <div className="flex items-center gap-3 mb-2">
                        <BookOpen className="text-emerald-500" size={32} />
                        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                            Manual del Módulo Financiero
                        </h1>
                    </div>
                    <p className="text-lg text-muted-foreground">
                        Guía paso a paso sobre casos de uso, generación de cobros y buenas prácticas del libro mayor.
                    </p>
                </header>

                <div className="space-y-12">
                    {/* Generar Matrículas */}
                    <section>
                        <h2 className="text-2xl font-bold flex items-center gap-2 mb-4 text-foreground/90">
                            <Wand2 className="text-blue-500" size={24} /> 1. Generar Matrículas Anuales
                        </h2>
                        <Card className="p-6 border-border/40 bg-card/40 leading-relaxed shadow-sm">
                            <p className="mb-4">
                                Las matrículas se deben generar habitualmente a principio de año lectivo. En lugar de cargar alumno por alumno, el sistema dispone de un <strong>Generador Masivo de Matrículas</strong>.
                            </p>
                            <h4 className="font-semibold mb-2">¿Cómo hacerlo?</h4>
                            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
                                <li>Ve a <i>Finanzas</i> y haz clic en el botón verde <strong>&quot;Generar Cuotas&quot;</strong>.</li>
                                <li>En el panel emergente, selecciona la pestaña <strong>Matrícula Anual</strong>.</li>
                                <li>Elige el <span className="text-foreground font-medium">año lectivo</span> correspondiente y fija el <span className="text-foreground font-medium">precio general</span>.</li>
                                <li>Al clicar <i>Generar Matrículas a Todos</i>, el sistema creará una deuda de matrícula para <b>todo alumno Activo/Egresado</b> que no posea ya una matrícula para ese año.</li>
                            </ul>
                        </Card>
                    </section>

                    {/* Generar Cuotas */}
                    <section>
                        <h2 className="text-2xl font-bold flex items-center gap-2 mb-4 text-foreground/90">
                            <CalendarPlus className="text-amber-500" size={24} /> 2. Generar Cuotas Mensuales
                        </h2>
                        <Card className="p-6 border-border/40 bg-card/40 leading-relaxed shadow-sm">
                            <p className="mb-4">
                                Las cuotas mensuales dependen 100% de los cursos a los que asiste el alumno. El sistema tomará el <strong>precio base del curso</strong> o la <i>beca personalizada (precio especial)</i> asignada en la ficha del alumno.
                            </p>
                            <h4 className="font-semibold mb-2">¿Cómo hacerlo?</h4>
                            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
                                <li>Ve a <i>Finanzas</i> y abre el botón verde <strong>&quot;Generar Cuotas&quot;</strong>.</li>
                                <li>En la pestaña <strong>Cuota Mensual (Cursos)</strong>, el mes y año predeterminado ya estarán seleccionados.</li>
                                <li>Haz clic en generar. El sistema detectará en qué cursos está inscripto cada alumno y le armará un recibo automático mensual sumando sus actividades.</li>
                                <li><i>Nota: Si un alumno ya tiene la cuota facturada en ese mes, el sistema será inteligente y no le imputará deuda doble.</i></li>
                            </ul>
                        </Card>
                    </section>

                    {/* Eliminar o editar cuotas mal generadas */}
                    <section>
                        <h2 className="text-2xl font-bold flex items-center gap-2 mb-4 text-foreground/90">
                            <Edit2 className="text-emerald-500" size={24} /> 3. Edición o Eliminación de Deudas
                        </h2>
                        <Card className="p-6 border-border/40 bg-card/40 leading-relaxed shadow-sm">
                            <p className="mb-4">
                                Si al facturar un mes o una matrícula masiva te das cuenta de que <strong>generaste el recibo con un precio equivocado</strong> (ej. tipeaste un 0 de más), puedes arreglar este error humano de inmediato.
                            </p>
                            <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-lg my-4 text-emerald-900 dark:text-emerald-100 text-sm">
                                <strong>Regla de Oro:</strong> Una deuda SÓLO se puede editar o eliminar si su estado es 100% <i>PENDIENTE</i> (el alumno no ha dado ni un centavo para ella).
                            </div>
                            <h4 className="font-semibold mb-2">Pasos para Corregir:</h4>
                            <ul className="list-none space-y-3 text-muted-foreground ml-2 mt-3">
                                <li className="flex items-start gap-2">
                                    <Edit2 size={18} className="text-muted-foreground mt-0.5" /> 
                                    <span>
                                        <strong>Para modificar el precio base:</strong> Ve a <i>Ver Deudores</i>, posa el mouse (o pulsa) sobre la cuota pendiente del alumno y haz clic en el <b>ícono del lápiz</b>. Sobreescribe el monto correcto.
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <Trash2 size={18} className="text-muted-foreground mt-0.5" /> 
                                    <span>
                                        <strong>Para borrar la deuda "fantasma":</strong> En <i>Ver Deudores</i>, posa el mouse en la cuota y haz clic en el <b>ícono del tacho de basura</b>. Desaparecerá de tu base contable para siempre.
                                    </span>
                                </li>
                            </ul>
                        </Card>
                    </section>

                    {/* Inmutabilidad del Libro Mayor */}
                    <section>
                        <h2 className="text-2xl font-bold flex items-center gap-2 mb-4 text-foreground/90">
                            <ShieldAlert className="text-purple-500" size={24} /> 4. Inmutabilidad: Por qué no se pueden borrar pagos
                        </h2>
                        <Card className="p-6 border-border/40 bg-card/40 leading-relaxed shadow-sm">
                            <p className="mb-4">
                                Cualquier movimiento que implique el flujo de dinero (cobrar una cuota parcial, pagarle el sueldo a un docente, vender un libro) ingresa directamente a nuestro <strong>Libro Mayor de Transacciones</strong>.
                            </p>
                            <p className="mb-4 text-muted-foreground">
                                A diferencia de un archivo Excel, en la contabilidad estandarizada (para evitar desfalcos o desequilibrios de caja) <strong>está prohibido borrar filas permanentemente</strong>. De esta manera garantizas trazabilidad: siempre sabrás quién grabó el cobro y en qué momento.
                            </p>
                            <p className="text-sm border-l-4 border-purple-500 pl-4 py-1 italic font-medium">
                                Si un secretario presiona cobrar un cheque de $10.000, ese dinero entra hoy a la rentabilidad del mes. Si lograra borrar el registro semanas más tarde para robar dinero de caja, tu contabilidad desaparecería. <strong>Por ello, el registro existe siempre.</strong>
                            </p>
                        </Card>
                    </section>

                    {/* Anulaciones */}
                    <section>
                        <h2 className="text-2xl font-bold flex items-center gap-2 mb-4 text-foreground/90">
                            <Undo2 className="text-rose-500" size={24} /> 5. Contra-asientos (Anular Errores Operativos)
                        </h2>
                        <Card className="p-6 border-border/40 bg-card/40 leading-relaxed shadow-sm">
                            <p className="mb-4">
                                Sabiendo que los ingresos no se pueden borrar pero <i>los humanos se equivocan</i>, nuestro sistema resuelve esto mediante las <strong>Anulaciones Financieras</strong>.
                            </p>
                            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 p-4 rounded-lg my-4 text-rose-900 dark:text-rose-100 text-sm">
                                <strong>¿Qué sucede cuando anulas un cobro equivocado?</strong> <br/>
                                1. La transacción original recibe un cartel rojo de <b>Anulado</b>.<br/>
                                2. El sistema inyecta en la caja un <b>contra-asiento automático</b> con dinero negativo (reembolso) para dejar la tesorería a cero.<br/>
                                3. La cuota del alumno vuelve a estar "Pendiente", desbloqueándose tu habilidad para borrarla (Paso 3).
                            </div>
                            <h4 className="font-semibold mb-2">¿Cómo anular un movimiento?</h4>
                            <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
                                <li>En el panel central de Finanzas baja al listado del <strong>Libro Mayor</strong> histórico.</li>
                                <li>Ubica la fila del registro erróneo que acabas de cargar. Al posar el mouse en el tramo derecho te aparecerá un símbolo <Undo2 className="inline text-rose-500 bg-rose-100 rounded px-0.5" size={18} />.</li>
                                <li>Dale clic y el sistema te pedirá el "Motivo" de la baja (ej. <i>Monto equivocado</i>).</li>
                                <li>Terminado esto, los KPI se descontarán y el informe se reseteará.</li>
                            </ul>
                        </Card>
                    </section>

                </div>
            </main>
        </div>
    );
}
