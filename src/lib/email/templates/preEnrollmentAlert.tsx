import { render } from "@react-email/components";
import PreEnrollmentAlertEmail from "./PreEnrollmentAlertEmail";

/**
 * En qué situación llegó el formulario.
 *
 * `nueva` es una preinscripción y nada más. Las otras tres son alguien que **ya
 * está en la base** volviendo a anotarse, y el instituto necesita saber cuál es
 * porque las tres piden cosas distintas: el activo probablemente quiere otra
 * cosa, el dado de baja quiere volver, y el que ya estaba preinscripto está
 * esperando una respuesta que no llegó.
 */
export type SituacionDePreinscripcion = "nueva" | "ya-activo" | "ya-de-baja" | "ya-preinscripto";

export type PreEnrollmentAlertEmailParams = {
    instituteName: string;
    /** De quién es el formulario que llegó. */
    studentName: string;
    situacion: SituacionDePreinscripcion;
    /** Si no dejó ninguna dirección: el instituto sólo puede responderle llamando. */
    sinCorreo: boolean;
    /** La pestaña de preinscriptos del campus. */
    url: string;
};

/**
 * El aviso al instituto de que entró un formulario (FEAT-12).
 *
 * **Es el correo espejo del acuse a la familia**
 * ([`preEnrollmentReceived`](./preEnrollmentReceived.tsx)) y sale del mismo lugar
 * de la misma acción. Pero no dicen lo mismo, y ésa es la razón de que sean dos
 * plantillas: a la familia se le contesta igual en las cuatro situaciones —para
 * que el formulario no sirva para averiguar quién es alumno del instituto—, y acá
 * se dice cuál es.
 *
 * El texto plano se escribe a mano por lo mismo que el otro. Es asíncrona porque
 * `render` lo es.
 */
export async function preEnrollmentAlertEmail(
    params: PreEnrollmentAlertEmailParams
): Promise<{ subject: string; text: string; html: string }> {
    const { instituteName, studentName, situacion, sinCorreo, url } = params;

    const esDuplicado = situacion !== "nueva";

    const subject = esDuplicado
        ? `${studentName} volvió a completar el formulario`
        : `Nueva preinscripción: ${studentName}`;

    const heading = esDuplicado ? "Volvió a anotarse" : "Nueva preinscripción";

    const yaEstaba: Record<Exclude<SituacionDePreinscripcion, "nueva">, string> = {
        "ya-activo": "Ya figura como alumno activo del instituto.",
        "ya-de-baja": "Ya tiene una ficha, dada de baja.",
        "ya-preinscripto": "Ya tenía una preinscripción sin atender.",
    };

    const parrafos = esDuplicado
        ? [
              `${studentName} completó el formulario de inscripción. ${yaEstaba[situacion]}`,
              // Importa decirlo: sin esto el instituto sale a buscar una ficha
              // nueva que no existe, y no encuentra nada.
              "No se creó una ficha nueva. A esta persona le contestamos lo mismo que a cualquiera que se anota, así que no sabe que ya estaba registrada: hay que comunicarse.",
          ]
        : [`${studentName} completó el formulario de inscripción.`];

    // El dato que decide si se le puede contestar por escrito o hay que llamar.
    const nota = sinCorreo
        ? "No dejó ningún correo de contacto, ni propio ni de un tutor: para responderle hay que llamar por teléfono."
        : undefined;

    // **El botón no dice lo mismo en los dos casos, y el enlace tampoco lleva al
    // mismo lado.** Un duplicado de alguien activo no está en la pestaña de
    // preinscriptos, así que mandarlo ahí lo deja mirando una lista donde esa
    // persona no aparece. Quien llama pasa el enlace que corresponde; acá se
    // nombra igual que lo que hay del otro lado.
    const boton = esDuplicado ? "Ver la ficha" : "Ver las preinscripciones";

    const text = [
        ...parrafos,
        `${boton}:\n${url}`,
        ...(nota ? [nota] : []),
        instituteName,
    ].join("\n\n");

    const html = await render(
        <PreEnrollmentAlertEmail
            instituteName={instituteName}
            preview={parrafos[0]}
            heading={heading}
            parrafos={parrafos}
            nota={nota}
            boton={boton}
            url={url}
        />
    );

    return { subject, text, html };
}
