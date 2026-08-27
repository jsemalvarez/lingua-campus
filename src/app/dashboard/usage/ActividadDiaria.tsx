import { Card } from "@/components/ui/Card";
import { CalendarClock } from "lucide-react";
import type { DiaActivo } from "./actividad";
import { pisoCorto } from "./piso";
import { BarrasDiarias } from "./BarrasDiarias";

const SERIES = [
    { clave: "alumno" as const, etiqueta: "Alumnos", color: "#38b397" },
    { clave: "tutor" as const, etiqueta: "Tutores", color: "#f6a138" },
    { clave: "staff" as const, etiqueta: "Profesores y administración", color: "#2e3192" },
];

/**
 * Personas activas por día (FEAT-11, métrica 7).
 *
 * **La curva no se dibuja el primer mes, y no es por prolijidad.** Mientras la
 * gente vuelve a iniciar sesión, el gráfico sube solo — y eso se lee como
 * crecimiento del uso cuando en realidad es la instrumentación llenándose. Un
 * contador con su fecha de piso dice la verdad; la curva, todavía no.
 */
export function ActividadDiaria({
    dias,
    diasConDatos,
    piso,
    diasNecesarios,
}: {
    dias: DiaActivo[];
    diasConDatos: number;
    piso: Date;
    diasNecesarios: number;
}) {
    const listo = diasConDatos >= diasNecesarios;

    if (!listo) {
        const personas = dias.reduce((acc, d) => acc + d.alumno + d.tutor + d.staff, 0);

        return (
            <Card variant="bordered" className="flex flex-col gap-5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Personas activas por día</p>
                        <h3 className="text-xl font-semibold text-muted-foreground mt-2">
                            Midiendo desde el {pisoCorto(piso)}
                        </h3>
                    </div>
                    <div className="bg-muted/60 text-muted-foreground p-3 rounded-xl shrink-0">
                        <CalendarClock size={24} />
                    </div>
                </div>

                <div className="flex-1 flex items-end gap-1.5 min-h-[88px] opacity-30">
                    {Array.from({ length: 13 }).map((_, i) => (
                        <div
                            key={i}
                            className="flex-1 rounded-sm bg-border"
                            style={{ height: i >= 13 - diasConDatos ? 22 : 8 }}
                        />
                    ))}
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed pt-3 border-t border-border/60 mt-auto">
                    Antes de esa fecha no se registraba ningún ingreso, así que{" "}
                    <strong className="text-foreground">no hay nada que mostrar hacia atrás</strong>. El gráfico
                    aparece con {diasNecesarios} días de historia; llevamos{" "}
                    <strong className="text-foreground">{diasConDatos}</strong>
                    {personas > 0 && `, con ${personas} ${personas === 1 ? "persona" : "personas"} en el período`}.
                </p>
            </Card>
        );
    }
    const promedio = Math.round(dias.reduce((acc, d) => acc + d.alumno + d.tutor + d.staff, 0) / dias.length);

    return (
        <Card className="flex flex-col gap-5">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">Personas activas por día</p>
                    <h3 className="text-3xl font-bold tracking-tight mt-1.5 tabular-nums">
                        {promedio} <span className="text-sm font-medium text-muted-foreground">promedio diario</span>
                    </h3>
                </div>
                <div className="bg-primary/10 text-primary p-3 rounded-xl shrink-0">
                    <CalendarClock size={24} />
                </div>
            </div>

            <BarrasDiarias
                columnas={dias.map((d) => ({
                    dia: d.dia,
                    valores: { alumno: d.alumno, tutor: d.tutor, staff: d.staff },
                }))}
                series={SERIES}
                unidad={["persona", "personas"]}
            />

            <div className="flex flex-wrap gap-4 pt-3 border-t border-border/60 mt-auto">
                {SERIES.map((s) => (
                    <span key={s.clave} className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                        <span className="text-xs text-muted-foreground">{s.etiqueta}</span>
                    </span>
                ))}
            </div>
        </Card>
    );
}
