/**
 * Un error escrito para que lo lea el usuario (ARQ-09): «El pago ya fue
 * anulado», «No se pueden eliminar categorías que ya tienen notas».
 *
 * **Existe para separarlo de los errores que no son para la pantalla.** Antes los
 * dos salían por el mismo `catch` con `error.message`, y junto con «El pago ya
 * fue anulado» llegaba a la secretaria un `Invalid prisma.fee.update()
 * invocation`. Ahora el `catch` pregunta: si es un `UserError`, se muestra tal
 * cual y no se registra —no es una falla, es el sistema diciendo que no—; si es
 * cualquier otra cosa, se registra y se muestra un mensaje amable.
 *
 * Va en su propio archivo, sin nada del servidor, para que también lo pueda
 * importar el código del navegador.
 */
/**
 * Lo que se le dice a la secretaria cuando el DNI o el correo del alumno ya los
 * tiene otro alumno del instituto (las dos únicas de `Student`). Se nombra el
 * campo porque es lo que tiene que corregir; si no se sabe cuál, los dos.
 */
export function repeatedStudentMessage(fields: string[]): string {
    if (fields.includes("dni")) return "Ya hay otro alumno con ese DNI en el instituto.";
    if (fields.includes("email")) return "Ya hay otro alumno con ese correo en el instituto.";
    return "Ya hay otro alumno con ese DNI o ese correo en el instituto.";
}

export class UserError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "UserError";
    }
}
