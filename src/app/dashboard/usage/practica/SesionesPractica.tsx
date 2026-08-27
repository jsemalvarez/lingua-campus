import { Card } from "@/components/ui/Card";
import { Gamepad2 } from "lucide-react";
import { FilaEstado, Titular } from "../Listado";
import { BarrasDiarias } from "../BarrasDiarias";
import { TIPOS, type Sesiones } from "./sesiones";

/**
 * El mosaico de sesiones de práctica (FEAT-16), al lado de la métrica 3.
 *
 * **Barras hechas con divs y no con `recharts`.** Es el mismo criterio que el
 * gráfico de personas activas: treinta barras apiladas no justifican traer una
 * librería de gráficos a esta pantalla, y así las dos curvas diarias del panel
 * se ven iguales en vez de parecerse.
 *
 * **No tiene fecha de piso.** `PracticeSession` existe desde que existe el
 * módulo, así que este mosaico se calcula hacia atrás sin límite, al revés de
 * las dos que salen del registro de actividad.
 */
export function SesionesPractica({
    sesiones,
    href,
}: {
    sesiones: Sesiones;
    /** El listado de práctica publicada, que es donde se ve clase por clase. */
    href: string;
}) {
    const { dias, total, porTipo, alumnos } = sesiones;

    return (
        <Card className="flex flex-col gap-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">Sesiones de práctica</p>
                    <h3 className="text-3xl font-bold tracking-tight mt-1.5 tabular-nums">
                        <Titular href={href} activo={total > 0}>
                            {total.toLocaleString("es-AR")}
                        </Titular>{" "}
                        <span className="text-sm font-medium text-muted-foreground">
                            {alumnos === 0
                                ? "en el período"
                                : `de ${alumnos} ${alumnos === 1 ? "alumno" : "alumnos"}`}
                        </span>
                    </h3>
                </div>
                <div className="bg-violet-50 text-violet-600 dark:bg-violet-500/10 p-3 rounded-xl shrink-0">
                    <Gamepad2 size={24} />
                </div>
            </div>

            {total === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                    Ningún alumno practicó en este período.
                </p>
            ) : (
                <>
                    <BarrasDiarias
                        columnas={dias.map((d) => ({
                            dia: d.dia,
                            valores: { SPEAKING: d.SPEAKING, LISTENING: d.LISTENING, CHAT: d.CHAT },
                        }))}
                        series={TIPOS}
                        unidad={["sesión", "sesiones"]}
                    />

                    <ul className="space-y-2.5">
                        {TIPOS.map((t) => (
                            <FilaEstado
                                key={t.clave}
                                color={t.color}
                                etiqueta={t.etiqueta}
                                valor={porTipo[t.clave]}
                            />
                        ))}
                    </ul>
                </>
            )}

            <p className="text-xs text-muted-foreground leading-relaxed pt-3 border-t border-border/60 mt-auto">
                {total === 0
                    ? "Es la otra mitad del mosaico de al lado: ahí se ve qué se publicó, acá qué se practicó."
                    : "Cuenta la práctica aunque después se borre la clase: el alumno la hizo igual."}
            </p>
        </Card>
    );
}
