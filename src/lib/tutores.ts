import { signsForThemselves } from "@/lib/reports/signatures";

/** Un campo de texto que la pantalla podría dibujar. La cadena vacía no lo es. */
function hayTexto(valor: string | null): boolean {
    return Boolean(valor && valor.trim());
}

/**
 * Si una pantalla tiene que mostrarle a este alumno la sección de tutores
 * (FEAT-28).
 *
 * **La edad sola no alcanza para ocultar.** La sección se esconde únicamente
 * cuando no hay *nada* que mostrar: sin datos de contacto cargados y sin
 * ninguna cuenta de tutor vinculada. Con cualquiera de las dos cosas se dibuja,
 * aunque el alumno sea grande — ocultar un dato cargado lo perdería de vista sin
 * borrarlo, y ocultar un vínculo activo dejaría a alguien viendo notas y cuotas
 * desde una pantalla a la que ya no se llega.
 *
 * **El corte de edad es `SELF_SIGNING_AGE` y eso es a propósito.** Es la misma
 * edad desde la que el alumno firma su propio informe: si esta pantalla usara
 * otra, habría un tramo donde la ficha esconde al tutor que el panel de firmas
 * todavía está persiguiendo. Sin fecha de nacimiento se lo trata como menor y se
 * muestra, igual que hace la firma.
 *
 * **Se calcula en el servidor.** La cadena de imports termina en `crypto`, así
 * que esto no puede entrar en un componente de cliente: las páginas resuelven el
 * booleano y lo pasan como prop.
 */
export function muestraSeccionDeTutores(
    alumno: {
        birthDate: Date | null;
        guardian1Name: string | null;
        guardian1Phone: string | null;
        guardian1Email: string | null;
        guardian2Name: string | null;
        guardian2Phone: string | null;
        guardian2Email: string | null;
        /** Cuántas cuentas de tutor tiene vinculadas. */
        cuentasVinculadas: number;
    },
    hoy: Date
): boolean {
    if (alumno.cuentasVinculadas > 0) return true;

    // **Sólo el nombre, y no el teléfono ni el correo.** No es un descuido: la
    // tarjeta dibuja teléfono y correo *dentro* de la rama del nombre, así que
    // un tutor con teléfono y sin nombre hoy no se ve —la ficha dice «Sin datos
    // registrados» igual— y contarlo como dato dejaba la sección dibujada y
    // vacía, que es exactamente lo que el cliente pidió sacar. Se encontró
    // verificando FEAT-28 en stage, con un alumno de 70 años.
    //
    // Son 8 alumnos en producción y [BUG-20] es el arreglo de la tarjeta. **El
    // día que la tarjeta dibuje ese teléfono, esta condición tiene que sumarlo**,
    // o la sección volvería a esconder algo que se ve.
    if (hayTexto(alumno.guardian1Name) || hayTexto(alumno.guardian2Name)) return true;

    return !signsForThemselves(alumno.birthDate, hoy);
}
