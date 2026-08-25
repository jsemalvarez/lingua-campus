"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { revisarContrasenasPorDefecto } from "./actions";

/**
 * Dispara la pasada de la métrica 6 y la sigue hasta el final (FEAT-11).
 *
 * **El bucle vive acá y no en el servidor** porque la pasada es por lotes: cada
 * llamada revisa unas pocas cuentas y devuelve cuántas faltan, así que alguien
 * tiene que volver a llamar. Hacerlo desde el navegador tiene dos ventajas sobre
 * un `while` del lado del servidor: ninguna llamada se acerca al límite de la
 * función, y el administrador ve avanzar el número en vez de mirar una pantalla
 * quieta durante un minuto.
 *
 * **Si se corta, no se pierde nada.** Lo revisado queda revisado; volver a
 * apretar sigue donde estaba.
 */
export function PasadaButton({ faltan }: { faltan: number }) {
    const router = useRouter();
    const [corriendo, setCorriendo] = useState(false);
    const [pendientes, setPendientes] = useState(faltan);
    const [error, setError] = useState<string | null>(null);

    const correr = async () => {
        setCorriendo(true);
        setError(null);

        // Tope de vueltas: si algo hiciera que `faltan` no baje —una cuenta que
        // no se puede resolver, por ejemplo—, esto se quedaría llamando para
        // siempre. Con el lote de 25, alcanza de sobra para miles de cuentas.
        for (let vuelta = 0; vuelta < 200; vuelta++) {
            const r = await revisarContrasenasPorDefecto();

            if (!r.ok) {
                setError(r.error ?? "Error al revisar las cuentas");
                break;
            }

            setPendientes(r.faltan);
            if (r.faltan === 0) break;

            // Ninguna cuenta resuelta y todavía faltan: seguir llamando sólo
            // gastaría conexiones sin avanzar.
            if (r.revisadas === 0) break;
        }

        setCorriendo(false);
        router.refresh();
    };

    return (
        <div className="space-y-2">
            <Button
                onClick={correr}
                disabled={corriendo}
                variant="outline"
                className="w-full flex items-center justify-center gap-2"
            >
                {corriendo ? (
                    <>
                        <Loader2 size={16} className="animate-spin" />
                        Revisando… faltan {pendientes}
                    </>
                ) : (
                    <>
                        <KeyRound size={16} />
                        Revisar {pendientes} cuentas
                    </>
                )}
            </Button>
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}
