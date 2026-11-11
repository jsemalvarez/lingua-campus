import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireSuperadmin } from "@/lib/authz";
import { bricolage, dmSans } from "@/components/landing/lingua/fonts";
import { Escenario } from "./Escenario";
import { enlacesDeLaDemo } from "./enlaces";
import { FONDO, SALIR, type Tono } from "./piezas";
import { RECORRIDO, TOTAL, hrefDePlaca } from "./recorrido";
import { Placa1, Placa2, Placa3, Portada } from "./placas-pedagogico";
import { Placa4, Placa5, Placa6, Placa7 } from "./placas-administrativo";
import { Placa8, Placa9 } from "./placas-cierre";

export const metadata: Metadata = { title: "Placas de la demo" };

const TONO_DE_LA_PLACA: Tono[] = ["crema", "crema", "crema", "crema", "tinta", "tinta", "tinta", "tinta", "crema", "crema"];

/**
 * Las placas que acompañan la demo del campus (10/11/2026). Las ve el instituto
 * que lo está evaluando; quien presenta las pasa con las flechas y abre lo real
 * con «Verlo en vivo», que va al Instituto Demo y nunca a un cliente.
 *
 * Son del super admin porque es la sesión desde la que se presenta.
 */
export default async function PlacasDeLaDemo({ searchParams }: { searchParams: Promise<{ placa?: string }> }) {
    if (!(await requireSuperadmin())) redirect("/login");

    const { placa } = await searchParams;
    const pedido = Number.parseInt(placa ?? "0", 10);
    const numero = Number.isInteger(pedido) && pedido >= 0 && pedido <= TOTAL ? pedido : 0;

    const enlaces = await enlacesDeLaDemo();
    const enVivo = RECORRIDO[numero].enVivo;
    const enlace = enVivo ? (enlaces?.[enVivo.enlace] ?? null) : null;

    const placas = [
        <Portada key={0} />,
        <Placa1 key={1} enlace={enlace} />,
        <Placa2 key={2} enlace={enlace} />,
        <Placa3 key={3} enlace={enlace} />,
        <Placa4 key={4} enlace={enlace} />,
        <Placa5 key={5} enlace={enlace} />,
        <Placa6 key={6} enlace={enlace} />,
        <Placa7 key={7} enlace={enlace} />,
        <Placa8 key={8} />,
        <Placa9 key={9} />,
    ];

    return (
        <div className={`${bricolage.variable} ${dmSans.variable} font-body antialiased`}>
            <Escenario
                fondo={FONDO[TONO_DE_LA_PLACA[numero]]}
                anterior={numero > 0 ? hrefDePlaca(numero - 1) : null}
                siguiente={numero < TOTAL ? hrefDePlaca(numero + 1) : null}
                salir={SALIR}
            >
                {placas[numero]}
            </Escenario>
        </div>
    );
}
