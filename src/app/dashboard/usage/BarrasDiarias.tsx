import { getMonthName } from "@/lib/utils";

/**
 * Las barras diarias del panel de uso, con el número duro al pasar por encima.
 *
 * **El desglose por color no alcanza.** El apilado dice la proporción, no la
 * cantidad: una barra de tres cuartos de alto puede ser 6 personas o 60 según el
 * techo del período, y el techo cambia cada vez que se cambia de mes. Sin el
 * número, el gráfico se puede comparar consigo mismo y con nada más.
 *
 * **Sin JavaScript, y funciona con el dedo.** El tooltip aparece con
 * `group-hover` y también con `group-focus`, y cada columna es enfocable: en una
 * computadora se ve al pasar por encima y en un teléfono, al tocar. Un
 * componente de cliente por esto habría sido traerse estado y bundle para
 * mostrar un cartel.
 *
 * Lo comparten el gráfico de personas activas y el de sesiones de práctica, así
 * que las dos se comportan igual — pero cada una pone su unidad en el pie del
 * cartel, que es justamente lo que las distingue: "4 personas" no es lo mismo
 * que "4 sesiones".
 */

export interface SerieDiaria {
    clave: string;
    etiqueta: string;
    color: string;
}

export interface ColumnaDiaria {
    /** `YYYY-MM-DD`. */
    dia: string;
    valores: Record<string, number>;
}

const ALTO = 132;

/** "lun 10 ago", leído en UTC porque el día ya viene resuelto. */
function fechaCorta(ymd: string): string {
    const d = new Date(`${ymd}T00:00:00Z`);
    const dias = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
    return `${dias[d.getUTCDay()]} ${d.getUTCDate()} ${getMonthName(d.getUTCMonth() + 1).slice(0, 3).toLowerCase()}`;
}

export function BarrasDiarias({
    columnas,
    series,
    unidad,
}: {
    columnas: ColumnaDiaria[];
    series: SerieDiaria[];
    /** Singular y plural de lo que se cuenta: `["persona", "personas"]`. */
    unidad: [string, string];
}) {
    const totalDe = (c: ColumnaDiaria) =>
        series.reduce((acc, s) => acc + (c.valores[s.clave] ?? 0), 0);

    const techo = Math.max(...columnas.map(totalDe), 1);
    const ultimas = columnas.length - 4;

    return (
        <div className="flex items-end gap-[3px]" style={{ height: ALTO }}>
            {columnas.map((c, i) => {
                const total = totalDe(c);

                // El cartel se centra sobre su columna, salvo en los extremos:
                // ahí se pega al borde para no salirse de la tarjeta.
                const anclaje =
                    i < 3 ? "left-0" : i > ultimas ? "right-0" : "left-1/2 -translate-x-1/2";

                return (
                    <div
                        key={c.dia}
                        tabIndex={0}
                        className="group relative flex-1 flex flex-col justify-end gap-[2px] min-w-[3px] outline-none cursor-default"
                    >
                        {series.map((s) => {
                            const valor = c.valores[s.clave] ?? 0;
                            if (valor === 0) return null;
                            return (
                                <div
                                    key={s.clave}
                                    className="transition-opacity group-hover:opacity-80 group-focus:opacity-80"
                                    style={{
                                        height: Math.max((valor / techo) * (ALTO - 8), 2),
                                        backgroundColor: s.color,
                                    }}
                                />
                            );
                        })}

                        {/* El día sin nada tiene que poder recibir el foco igual:
                            "ese martes no entró nadie" es un dato, y una columna
                            vacía sin cartel parece un hueco del gráfico. */}
                        {total === 0 && <div className="h-[2px] bg-border" />}

                        <div
                            className={`pointer-events-none absolute bottom-full mb-2 ${anclaje} z-20 w-max opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity`}
                        >
                            <div className="rounded-lg border border-border bg-card shadow-lg px-3 py-2 space-y-1">
                                <p className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">
                                    {fechaCorta(c.dia)}
                                </p>
                                {total === 0 ? (
                                    <p className="text-sm font-semibold whitespace-nowrap">Sin actividad</p>
                                ) : (
                                    <>
                                        {series.map((s) => {
                                            const valor = c.valores[s.clave] ?? 0;
                                            if (valor === 0) return null;
                                            return (
                                                <p
                                                    key={s.clave}
                                                    className="flex items-center justify-between gap-4 text-xs whitespace-nowrap"
                                                >
                                                    <span className="flex items-center gap-1.5">
                                                        <span
                                                            className="h-2 w-2 rounded-full shrink-0"
                                                            style={{ backgroundColor: s.color }}
                                                        />
                                                        {s.etiqueta}
                                                    </span>
                                                    <span className="font-semibold tabular-nums">{valor}</span>
                                                </p>
                                            );
                                        })}
                                        <p className="flex items-center justify-between gap-4 text-xs pt-1 border-t border-border/60 whitespace-nowrap">
                                            <span className="text-muted-foreground">Total</span>
                                            <span className="font-bold tabular-nums">
                                                {total} {total === 1 ? unidad[0] : unidad[1]}
                                            </span>
                                        </p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
