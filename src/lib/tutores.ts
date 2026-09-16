import { signsForThemselves } from "@/lib/reports/signatures";

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

    // Los seis campos que la tarjeta puede llegar a dibujar. `relation` queda
    // afuera a propósito: sin nombre no es un contacto, es un rótulo suelto.
    const tieneDatos = Boolean(
        alumno.guardian1Name ||
        alumno.guardian1Phone ||
        alumno.guardian1Email ||
        alumno.guardian2Name ||
        alumno.guardian2Phone ||
        alumno.guardian2Email
    );
    if (tieneDatos) return true;

    return !signsForThemselves(alumno.birthDate, hoy);
}
