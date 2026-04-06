import { Navbar } from "@/components/layout/Navbar";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { BookOpen, Users, CreditCard, GraduationCap, Info, CalendarPlus, Wand2, ShieldAlert, Undo2, Trash2, Edit2, FileText } from "lucide-react";
import { Card } from "@/components/ui/Card";

export default async function HelpCenterPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) redirect("/login");

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="mb-10 lg:mb-14">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
                        <BookOpen size={16} /> Base de Conocimiento
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 text-foreground/90">
                        Centro de Ayuda
                    </h1>
                    <p className="text-muted-foreground text-base sm:text-lg max-w-2xl leading-relaxed">
                        Encuentra guías detalladas sobre el funcionamiento interno de Lingua Campus. Aprende a dominar los flujos complejos, asignar permisos y gestionar cuentas.
                    </p>
                </header>

                <div className="grid gap-8 relative">
                    {/* Sección 1: Roles */}
                    <section id="roles" className="scroll-mt-24 space-y-4">
                        <div className="flex items-center gap-3 border-b border-border/60 pb-3 mb-6">
                            <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl">
                                <Users size={24} />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight">Gestión de Roles y Accesos</h2>
                        </div>

                        <Card className="p-6 border-border/50 shadow-sm space-y-6 bg-card/60">
                            <div>
                                <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                                    <Info size={18} className="text-primary" /> ¿Cómo asignar múltiples roles a una persona?
                                </h3>
                                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                                    Lingua Campus utiliza una arquitectura de **"Múltiples Roles por Cuenta"**. Esto significa que una persona (por ejemplo, el director del instituto) no necesita crearse dos cuentas distintas si además de Administrar, quiere dar clases o tiene un hijo inscripto.
                                </p>
                            </div>

                            <div className="pl-4 border-l-2 border-primary/30 space-y-4">
                                <div>
                                    <h4 className="text-[15px] font-semibold mb-1">Para otorgar rol de "Profesor" a un Tutor existente:</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Ve a la pestaña <b>Personal</b> y haz clic en "Añadir Profesor". En el formulario, completa los datos utilizando el <b>correo electrónico exacto</b> que el tutor ya tiene registrado. El sistema interceptará el correo y le inyectará el rol docente sin sobreescribir su historial familiar.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-[15px] font-semibold mb-1">Para otorgar rol de "Tutor" a un Profesor existente:</h4>
                                    <p className="text-sm text-muted-foreground">
                                        Ve al perfil del estudiante en cuestión. En la tarjeta "Tutores Legales", haz clic en "Añadir Tutor" e ingresa el <b>correo del profesor</b>. El profesor pasará a tener asignado a su hijo en su nuevo "Modo Tutor" accesible desde la barra superior.
                                    </p>
                                </div>

                                <div className="mt-8 p-5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 rounded-xl">
                                    <h4 className="text-[15px] font-semibold mb-2 text-amber-800 dark:text-amber-500">¿Qué hago si ya creé cuentas duplicadas por error?</h4>
                                    <p className="text-sm text-amber-700/80 dark:text-amber-500/80 mb-4 leading-relaxed">
                                        Si por desconocimiento creaste dos cuentas separadas (ej. <code>admin@escuela.com</code> para administrar y <code>profe@escuela.com</code> para dar clases), el sistema <b>no te permitirá unificarlas simplemente editando el correo</b> de una sobre la otra para garantizar la integridad de los datos.
                                    </p>
                                    <h5 className="font-bold text-sm mb-2 text-amber-800 dark:text-amber-500">Pasos para migrar y unificar a Multi-Rol:</h5>
                                    <ol className="list-decimal pl-5 text-sm text-amber-700/90 dark:text-amber-500/90 space-y-2.5">
                                        <li>Ve a <b>Personal &gt; Añadir Profesor</b> y créalo usando el correo principal que deseas conservar (ej. <i>admin@escuela.com</i>). El sistema te autodetectará e inyectará el rol Docente.</li>
                                        <li>Si también eres tutor de un estudiante, ve al perfil del alumno, clic en <b>Añadir Tutor</b> y usa exactamente el mismo correo (<i>admin@escuela.com</i>).</li>
                                        <li>Ve a la pestaña <b>Cursos</b>, remueve al profesor viejo de los listados y asígnate a ti mismo.</li>
                                        <li>Regresa a <b>Personal</b> y elimina o archiva la cuenta vieja duplicada que ya no dicta clases. ¡Listo, tendrás todos tus ingresos unificados!</li>
                                    </ol>
                                </div>
                            </div>
                        </Card>
                    </section>

                    {/* Sección 2: Pagos */}
                    <section id="pagos" className="scroll-mt-24 space-y-4 mt-8">
                        <div className="flex items-center gap-3 border-b border-border/60 pb-3 mb-6">
                            <div className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl">
                                <CreditCard size={24} />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight">Facturación y Pagos</h2>
                        </div>

                        <div className="space-y-12">
                            {/* Generar Matrículas */}
                            <section>
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-foreground/90">
                                    <Wand2 className="text-blue-500" size={20} /> 1. Gestión de Matrículas Anuales
                                </h3>
                                <Card className="p-6 border-border/40 bg-card/40 leading-relaxed shadow-sm space-y-6">

                                    {/* Caso 1: Generación Masiva */}
                                    <div>
                                        <h4 className="font-bold mb-2 flex items-center gap-2 text-primary">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs">A</span>
                                            Generación Masiva (Principio de Año)
                                        </h4>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            Ideal para cargar la deuda de inscripción a todo el alumnado activo de una sola vez.
                                        </p>
                                        <ul className="list-disc list-inside space-y-1.5 text-xs text-muted-foreground ml-2">
                                            <li>Botón <strong>"Generar Cuotas"</strong> &rarr; Pestaña <strong>Matrícula Anual</strong>.</li>
                                            <li>Al ejecutarlo, se creará el recibo pendiente para <b>todos los alumnos Activos</b> que aún no la tengan.</li>
                                        </ul>
                                    </div>

                                    <hr className="border-border/40" />

                                    {/* Caso 2: Matrícula Anticipada */}
                                    <div>
                                        <h4 className="font-bold mb-2 flex items-center gap-2 text-primary">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs">B</span>
                                            Matrícula Anticipada (Sin Curso)
                                        </h4>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            ¿Un alumno nuevo quiere asegurar su lugar para el <strong>próximo año</strong> pero aún no definiste los horarios ni cursos?
                                        </p>
                                        <ul className="list-disc list-inside space-y-1.5 text-xs text-muted-foreground ml-2">
                                            <li>En el panel de Finanzas, ve a la caja verde de la izquierda y haz clic en la pestaña <strong>"Matrícula"</strong>.</li>
                                            <li>Busca al alumno, elige el año (Actual o Próximo) y el monto.</li>
                                            <li>Esto genera una deuda "Standalone". Cuando luego inscribas al alumno a un curso, el sistema <b>detectará que ya pagó/debe la matrícula</b> y las vinculará automáticamente.</li>
                                        </ul>
                                    </div>

                                    <hr className="border-border/40" />

                                    {/* Caso 3: Autogeneración por Inscripción */}
                                    <div>
                                        <h4 className="font-bold mb-2 flex items-center gap-2 text-primary">
                                            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs">C</span>
                                            Autogeneración al Inscribir
                                        </h4>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            Si inscribes a un alumno desde el formulario de <strong>"Nueva Inscripción"</strong>:
                                        </p>
                                        <ul className="list-disc list-inside space-y-1.5 text-xs text-muted-foreground ml-2">
                                            <li>El sistema verificará el <strong>Precio de Matrícula</strong> configurado en ese Curso.</li>
                                            <li>Si el alumno no tiene matrícula para este año, la creará en ese mismo instante.</li>
                                            <li>Puedes sobreescribir este precio (Beca de Inscripción) directamente en el formulario de inscripción.</li>
                                        </ul>
                                    </div>

                                </Card>
                            </section>

                            {/* Generar Cuotas */}
                            <section>
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-foreground/90">
                                    <CalendarPlus className="text-amber-500" size={20} /> 2. Generar Cuotas Mensuales
                                </h3>
                                <Card className="p-6 border-border/40 bg-card/40 leading-relaxed shadow-sm">
                                    <p className="mb-4">
                                        Las cuotas mensuales dependen 100% de los cursos a los que asiste el alumno. El sistema tomará el <strong>precio base del curso</strong> o la <i>beca personalizada (precio especial)</i> asignada en la ficha del alumno.
                                    </p>
                                    <h4 className="font-semibold mb-2 flex gap-1 items-center">¿Cómo hacerlo?</h4>
                                    <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2">
                                        <li>Ve a <i>Finanzas</i> y abre el botón verde <strong>&quot;Generar Cuotas&quot;</strong>.</li>
                                        <li>En la pestaña <strong>Cuota Mensual (Cursos)</strong>, el mes y año predeterminado ya estarán seleccionados.</li>
                                        <li>Haz clic en generar. El sistema detectará en qué cursos está inscripto cada alumno y le armará un recibo automático mensual sumando sus actividades.</li>
                                        <li className="text-xs"><i>Nota: Si un alumno ya tiene la cuota facturada en ese mes, el sistema será inteligente y no le imputará deuda doble.</i></li>
                                    </ul>
                                </Card>
                            </section>

                            {/* Eliminar o editar cuotas mal generadas */}
                            <section>
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-foreground/90">
                                    <Edit2 className="text-emerald-500" size={20} /> 3. Edición o Eliminación de Deudas
                                </h3>
                                <Card className="p-6 border-border/40 bg-card/40 leading-relaxed shadow-sm">
                                    <p className="mb-4">
                                        Si al facturar un mes o una matrícula masiva te das cuenta de que <strong>generaste el recibo con un precio equivocado</strong> (ej. tipeaste un 0 de más), puedes arreglar este error humano de inmediato.
                                    </p>
                                    <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-lg my-4 text-emerald-900 dark:text-emerald-100 text-sm">
                                        <strong>Regla de Oro:</strong> Una deuda SÓLO se puede editar o eliminar si su estado es 100% <i>PENDIENTE</i> (el alumno no ha dado ni un centavo para ella).
                                    </div>
                                    <h4 className="font-semibold mb-2">Pasos para Corregir:</h4>
                                    <ul className="list-none space-y-3 text-muted-foreground ml-2 mt-3 text-sm">
                                        <li className="flex items-start gap-2">
                                            <Edit2 size={16} className="text-muted-foreground" />
                                            <span>
                                                <strong>Para modificar el precio base:</strong> Ve a <i>Ver Deudores</i>, posa el mouse (o pulsa) sobre la cuota pendiente del alumno y haz clic en el <b>ícono del lápiz</b>. Sobreescribe el monto correcto.
                                            </span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <Trash2 size={16} className="text-muted-foreground" />
                                            <span>
                                                <strong>Para borrar la deuda "fantasma":</strong> En <i>Ver Deudores</i>, posa el mouse en la cuota y haz clic en el <b>ícono del tacho de basura</b>. Desaparecerá de tu base contable para siempre.
                                            </span>
                                        </li>
                                    </ul>
                                </Card>
                            </section>

                            {/* Inmutabilidad del Libro Mayor */}
                            <section>
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-foreground/90">
                                    <ShieldAlert className="text-purple-500" size={20} /> 4. Inmutabilidad: Por qué no se pueden borrar pagos
                                </h3>
                                <Card className="p-6 border-border/40 bg-card/40 leading-relaxed shadow-sm">
                                    <p className="mb-4">
                                        Cualquier movimiento que implique el flujo de dinero (cobrar una cuota parcial, pagarle el sueldo a un docente, vender un libro) ingresa directamente a nuestro <strong>Libro Mayor de Transacciones</strong>.
                                    </p>
                                    <p className="mb-4 text-muted-foreground text-sm">
                                        A diferencia de un archivo Excel, en la contabilidad estandarizada (para evitar desfalcos o desequilibrios de caja) <strong>está prohibido borrar filas permanentemente</strong>. De esta manera garantizas trazabilidad: siempre sabrás quién grabó el cobro y en qué momento.
                                    </p>
                                    <p className="text-xs border-l-4 border-purple-500 pl-4 py-1 italic font-medium">
                                        Si un secretario presiona cobrar un cheque de $10.000, ese dinero entra hoy a la rentabilidad del mes. Si lograra borrar el registro semanas más tarde para robar dinero de caja, tu contabilidad desaparecería. <strong>Por ello, el registro existe siempre.</strong>
                                    </p>
                                </Card>
                            </section>

                            {/* Anulaciones */}
                            <section>
                                <h3 className="text-xl font-bold flex items-center gap-2 mb-4 text-foreground/90">
                                    <Undo2 className="text-rose-500" size={20} /> 5. Contra-asientos (Anular Errores Operativos)
                                </h3>
                                <Card className="p-6 border-border/40 bg-card/40 leading-relaxed shadow-sm">
                                    <p className="mb-4">
                                        Sabiendo que los ingresos no se pueden borrar pero <i>los humanos se equivocan</i>, nuestro sistema resuelve esto mediante las <strong>Anulaciones Financieras</strong>.
                                    </p>
                                    <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 p-4 rounded-xl my-4 text-rose-900 dark:text-rose-100 text-sm">
                                        <strong>¿Qué sucede cuando anulas un cobro encarecido o erróneo?</strong> <br />
                                        <div className="mt-2 text-xs space-y-1">
                                            <p>1. La transacción original recibe un cartel rojo de <b>Anulado</b>.</p>
                                            <p>2. El sistema inyecta en la caja un <b>contra-asiento automático</b> con dinero negativo (reembolso) para dejar la tesorería a cero.</p>
                                            <p>3. La cuota del alumno vuelve a estar "Pendiente", desbloqueándose tu habilidad para borrarla (Paso 3).</p>
                                        </div>
                                    </div>
                                    <h4 className="font-semibold mb-2">¿Cómo anular un movimiento?</h4>
                                    <ul className="list-disc list-inside space-y-2 text-muted-foreground ml-2 text-sm">
                                        <li>En el panel central de Finanzas baja al listado del <strong>Libro Mayor</strong> histórico.</li>
                                        <li>Ubica la fila del registro erróneo que acabas de cargar. Al posar el mouse en el tramo derecho te aparecerá un símbolo <Undo2 className="inline text-rose-500 bg-rose-100 rounded px-0.5" size={16} />.</li>
                                        <li>Dale clic y el sistema te pedirá el "Motivo" de la baja (ej. <i>Monto equivocado</i>).</li>
                                        <li>Terminado esto, los KPI se descontarán y el informe se reseteará.</li>
                                    </ul>
                                </Card>
                            </section>
                        </div>
                    </section>

                    {/* Sección 3: Alumnos */}
                    <section id="alumnos" className="scroll-mt-24 space-y-4 mt-8">
                        <div className="flex items-center gap-3 border-b border-border/60 pb-3 mb-6">
                            <div className="p-2.5 bg-purple-500/10 text-purple-500 rounded-xl">
                                <GraduationCap size={24} />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight">Ciclo del Estudiante</h2>
                        </div>

                        <Card className="p-6 border-border/50 shadow-sm space-y-4 bg-card/60">
                            <h3 className="text-lg font-bold text-foreground">¿Qué ocurre comercialmente al dar de baja a un alumno?</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Cuando marcas a un estudiante como inactivo o eliminado, su perfil financiero y académico se archiva. <br /><br />
                                <b>Importante:</b> La cuenta del padre/madre (Tutor) <b>NO se elimina</b>. Hemos diseñado esta regla para que el tutor pueda seguir iniciando sesión y saldar deudas pendientes (o consultar recibos viejos) mediante un panel de lectura histórico, protegiendo las finanzas de tu instituto.
                            </p>
                        </Card>
                    </section>

                    {/* Sección 4: Exámenes Finales */}
                    <section id="examenes" className="scroll-mt-24 space-y-4 mt-8">
                        <div className="flex items-center gap-3 border-b border-border/60 pb-3 mb-6">
                            <div className="p-2.5 bg-fuchsia-500/10 text-fuchsia-500 rounded-xl">
                                <FileText size={24} />
                            </div>
                            <h2 className="text-2xl font-bold tracking-tight">Exámenes Finales</h2>
                        </div>

                        <Card className="p-6 border-border/50 shadow-sm space-y-6 bg-card/60">
                            <div>
                                <h3 className="text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                                    <Info size={18} className="text-fuchsia-500" /> Funcionamiento Integrado (Académico y Contable)
                                </h3>
                                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                                    El flujo de fin de año está automatizado para evitar carga manual duplicada. Al habilitar a un alumno para rendir, se afectan simultáneamente sus finanzas y libretas de asistencia.
                                </p>
                            </div>

                            <div className="pl-4 border-l-2 border-fuchsia-500/30 space-y-4 text-sm text-muted-foreground">
                                <div>
                                    <h4 className="text-[15px] font-semibold mb-1 text-foreground">1. Configurar el valor Base</h4>
                                    <p>
                                        Al crear o editar un Curso, verás el campo <strong>Derecho de Examen ($)</strong>. Todos los alumnos inscriptos en ese curso heredarán este precio al habilitarles el examen.
                                    </p>
                                </div>
                                <div>
                                    <h4 className="text-[15px] font-semibold mb-1 text-foreground">2. Activar a un Alumno (Inscripción al Examen)</h4>
                                    <p>
                                        Ingresa a la <strong>Ficha del Alumno</strong>. En la lista de sus cursos activos notarás un interruptor o <i>switch</i> de <strong>"Examen Final"</strong>. Al encenderlo ocurren tres cosas en tiempo real:
                                    </p>
                                    <ul className="list-disc list-inside mt-2 space-y-1 ml-2">
                                        <li>Se activa administrativamente para rendir.</li>
                                        <li>Aparece automáticamente el cargo o deuda etiquetada como <strong>"Derecho de Examen"</strong> en su cuenta bancaria/corriente.</li>
                                        <li>El profesor de su curso verá generada la clase especial (Libro de temas de tipo <i>EXAM</i>) para cargar notas/asistencias.</li>
                                    </ul>
                                </div>

                                <div className="mt-6 p-4 bg-fuchsia-50 dark:bg-fuchsia-950/20 border border-fuchsia-200 dark:border-fuchsia-800/50 rounded-xl">
                                    <h4 className="text-[14px] font-semibold mb-1 text-fuchsia-800 dark:text-fuchsia-400">¿Me equivoqué al inscribirlo?</h4>
                                    <p className="text-fuchsia-700/80 dark:text-fuchsia-300/80 leading-relaxed">
                                        Simplemente <b>apaga el interruptor</b> en la ficha del alumno. Si el estudiante aún no abonó el derecho de examen, la deuda "fantasma" será eliminada inmediatamente del sistema para no alterar tu contabilidad. <i>(Si ya había pagado, deberás generar un reintegro anulando su pago en la pestaña de Finanzas primero).</i>
                                    </p>
                                </div>
                            </div>
                        </Card>
                    </section>
                </div>
            </main>
        </div>
    );
}
