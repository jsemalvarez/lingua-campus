import { Card } from "@/components/ui/Card";
import { KeyRound } from "lucide-react";
import { FilaEstado, Titular } from "../Listado";
import { NOMBRE_DEL_GRUPO, type Contrasenas, type Grupo } from "./datos";
import { PasadaButton } from "./PasadaButton";

/**
 * El mosaico de la métrica 6 (FEAT-11).
 *
 * **Con cuentas sin revisar no muestra un número.** Un total parcial presentado
 * como total es la misma trampa que hizo que esta métrica se reescribiera el
 * 2026-08-24: dice menos de lo que hay y no avisa. Mientras falte una cuenta,
 * la tarjeta muestra el botón de la pasada y cuántas quedan.
 */
const ORDEN: Grupo[] = ["alumno", "tutor", "profesor", "administracion"];

export function TarjetaContrasenas({
    datos,
    href,
}: {
    datos: Contrasenas;
    /** El listado, con el período que traía el panel. */
    href: string;
}) {
    const { sinRevisar, total, porGrupo } = datos;

    if (sinRevisar > 0) {
        return (
            <Card variant="bordered" className="flex flex-col gap-5">
                <Encabezado titulo={<span className="text-xl font-semibold text-muted-foreground mt-2 block">Sin medir todavía</span>} />

                <div className="flex-1 flex items-center justify-center min-h-[88px]">
                    <div className="flex items-end gap-1.5 h-16 w-full opacity-30">
                        {[8, 8, 8, 8, 8, 8, 8, 8].map((h, i) => (
                            <div key={i} className="flex-1 rounded-sm bg-border" style={{ height: h }} />
                        ))}
                    </div>
                </div>

                <PasadaButton faltan={sinRevisar} />

                <p className="text-xs text-muted-foreground leading-relaxed pt-3 border-t border-border/60 mt-auto">
                    Averiguarlo cuesta una comparación por cuenta y no se puede resolver con una
                    consulta, así que se hace <strong className="text-foreground">una sola vez</strong>. Después
                    se mantiene solo: cada cambio de contraseña actualiza su cuenta.
                </p>
            </Card>
        );
    }

    return (
        <Card className="flex flex-col gap-5">
            <Encabezado
                titulo={
                    <h3 className="text-3xl font-bold tracking-tight mt-1.5 tabular-nums">
                        <Titular href={href} activo={total > 0}>
                            {total}
                        </Titular>{" "}
                        <span className="text-sm font-medium text-muted-foreground">
                            {total === 1 ? "cuenta" : "cuentas"}
                        </span>
                    </h3>
                }
            />

            <ul className="space-y-2.5">
                {ORDEN.map((g) => (
                    <FilaEstado
                        key={g}
                        etiqueta={NOMBRE_DEL_GRUPO[g]}
                        valor={porGrupo[g]}
                        href={`${href}&grupo=${g}`}
                        destacada={g === "administracion"}
                    />
                ))}
            </ul>

            <p className="text-xs text-muted-foreground leading-relaxed pt-3 border-t border-border/60 mt-auto">
                {total === 0 ? (
                    "Ninguna cuenta conserva la contraseña que le dio el sistema."
                ) : (
                    <>
                        Son contraseñas escritas en el código y conocidas por quien las repartió.{" "}
                        <strong className="text-foreground">No dice quién entró</strong>: nada obliga a
                        cambiarlas, así que una cuenta muy usada puede seguir con la suya.
                    </>
                )}
            </p>
        </Card>
    );
}

function Encabezado({ titulo }: { titulo: React.ReactNode }) {
    return (
        <div className="flex items-start justify-between gap-3">
            <div>
                <p className="text-sm font-medium text-muted-foreground">
                    Cuentas con la contraseña por defecto
                </p>
                {titulo}
            </div>
            <div className="bg-amber-50 text-amber-600 dark:bg-amber-500/10 p-3 rounded-xl shrink-0">
                <KeyRound size={24} />
            </div>
        </div>
    );
}
