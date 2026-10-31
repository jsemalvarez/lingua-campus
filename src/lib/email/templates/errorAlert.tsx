import { render } from "@react-email/components";
import ErrorAlertEmail from "./ErrorAlertEmail";

export type ErrorAlertEmailParams = {
    /** Nombre del instituto, o «Plataforma» cuando no hay ninguno. */
    instituteName: string;
    area: string;
    /** Qué estaba haciendo, en castellano: «Chat con IA», «Guardar asistencia». */
    accion: string;
    /** El detalle que sale del contexto: «curso Children 4, clase «Unit 21»». */
    detalle: string | null;
    quien: string;
    cuando: string;
    message: string;
    /** Cuántas veces pasó en total este problema, en cualquier instituto. */
    vecesEnTotal: number;
    /** En cuántos institutos se vio, contando éste. */
    institutos: number;
};

/**
 * El aviso de que algo le falló a alguien en un instituto, por primera vez
 * (ARQ-09).
 *
 * Sale una sola vez por problema y por instituto. No dice «revisá el panel» como
 * lo único útil: trae todo lo que hace falta para escribirle al instituto sin
 * abrir nada más —qué estaba haciendo, quién, cuándo—, que es para lo que existe.
 *
 * El texto plano se escribe a mano, como en los otros correos.
 */
export async function errorAlertEmail(
    params: ErrorAlertEmailParams
): Promise<{ subject: string; text: string; html: string }> {
    const { instituteName, area, accion, detalle, quien, cuando, message, vecesEnTotal, institutos } = params;

    const subject = `${instituteName}: falló «${accion}»`;
    const heading = `Falló «${accion}» en ${instituteName}`;

    const filas: [string, string][] = [
        ["Área", area],
        ["Qué hacía", detalle ? `${accion}, ${detalle}` : accion],
        ["Quién", quien],
        ["Cuándo", cuando],
        ["Vio", "Un cartel de error en pantalla"],
        ["Error", message],
    ];

    // Lo que decide si es un deploy roto o algo que ya se conocía.
    const contexto =
        institutos > 1
            ? `Este problema ya se había visto en otro instituto (${vecesEnTotal} veces en total). Es la primera vez en ${instituteName}.`
            : vecesEnTotal > 1
              ? `Ya había pasado ${veces(vecesEnTotal - 1)} en ${instituteName} antes de este aviso.`
              : "Es la primera vez que pasa en el campus.";

    const nota = `No se vuelve a avisar de este problema en ${instituteName}: las repeticiones se suman en el panel.`;

    const text = [
        heading,
        filas.map(([etiqueta, valor]) => `${etiqueta}: ${valor}`).join("\n"),
        contexto,
        nota,
    ].join("\n\n");

    const html = await render(
        <ErrorAlertEmail preview={`${area} · ${quien} · ${cuando}`} heading={heading} filas={filas} contexto={contexto} nota={nota} />
    );

    return { subject, text, html };
}

function veces(n: number): string {
    return n === 1 ? "una vez" : `${n} veces`;
}
