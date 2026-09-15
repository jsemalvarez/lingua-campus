import { mkdirSync, writeFileSync } from "fs";
import { passwordResetEmail } from "./src/lib/email/templates/passwordReset";
import { preEnrollmentReceivedEmail } from "./src/lib/email/templates/preEnrollmentReceived";
import { preEnrollmentAlertEmail } from "./src/lib/email/templates/preEnrollmentAlert";

/**
 * Escribe cada correo del sistema a un HTML suelto, para mirarlos sin mandarlos.
 *
 *   npm run preview:email                 → los deja en .preview-emails/
 *   npm run preview:email -- ./otra/ruta  → o donde le digas
 *
 * **Los casos que están acá no son de adorno: son los que se equivocan solos.**
 * El correo que le llega al tutor y no al dueño de la contraseña, el acuse
 * cuando el instituto no tiene a dónde responder, y el aviso de alguien que ya
 * estaba en la base. Si agregás una plantilla, agregá acá su caso raro.
 *
 * También es lo que hace verificable un cambio de forma: se rinde antes, se
 * cambia, se rinde después y se comparan los HTML. Así se comprobó que sacar la
 * cáscara a `EmailShell` no movía un solo byte del correo de recuperación, que
 * ya estaba en producción.
 */

const INSTITUTO = "Modern English School";
const CAMPUS = "https://modernenglishschool.com.ar";

(async () => {
    const salida = process.argv[2] ?? ".preview-emails";
    mkdirSync(salida, { recursive: true });

    const escribir = (nombre: string, correo: { subject: string; text: string; html: string }) => {
        writeFileSync(`${salida}/${nombre}.html`, correo.html);
        writeFileSync(`${salida}/${nombre}.txt`, `${correo.subject}\n\n${correo.text}`);
    };

    // ── FEAT-05 · recuperación de contraseña ──
    escribir(
        "reset-tutor",
        await passwordResetEmail({
            subjectName: "Tomás Ferreyra",
            recipientName: "Laura Ferreyra",
            esParaOtro: true,
            instituteName: INSTITUTO,
            url: `${CAMPUS}/reset-password/8f3a1c9e2b7d4a60`,
            ttlMinutes: 60,
        })
    );

    escribir(
        "reset-propio",
        await passwordResetEmail({
            subjectName: "Juan Pérez",
            esParaOtro: false,
            instituteName: INSTITUTO,
            url: `${CAMPUS}/reset-password/8f3a1c9e2b7d4a60`,
            ttlMinutes: 60,
        })
    );

    // ── FEAT-20 · el acuse a la familia ──
    escribir(
        "acuse",
        await preEnrollmentReceivedEmail({
            instituteName: INSTITUTO,
            studentName: "Tomás Ferreyra",
            puedeResponder: true,
        })
    );

    escribir(
        "acuse-sin-respuesta",
        await preEnrollmentReceivedEmail({
            instituteName: INSTITUTO,
            studentName: "Tomás Ferreyra",
            puedeResponder: false,
        })
    );

    // ── FEAT-12 · el aviso al instituto ──
    escribir(
        "aviso-nueva",
        await preEnrollmentAlertEmail({
            instituteName: INSTITUTO,
            studentName: "Tomás Ferreyra",
            situacion: "nueva",
            sinCorreo: false,
            url: `${CAMPUS}/students?tab=pre-enrolled`,
        })
    );

    escribir(
        "aviso-sin-correo",
        await preEnrollmentAlertEmail({
            instituteName: INSTITUTO,
            studentName: "Tomás Ferreyra",
            situacion: "nueva",
            sinCorreo: true,
            url: `${CAMPUS}/students?tab=pre-enrolled`,
        })
    );

    escribir(
        "aviso-duplicado",
        await preEnrollmentAlertEmail({
            instituteName: INSTITUTO,
            studentName: "Tomás Ferreyra",
            situacion: "ya-activo",
            sinCorreo: false,
            // El duplicado lleva a la ficha del que ya estaba, no al listado de
            // preinscriptos: ahí no aparece.
            url: `${CAMPUS}/students/clz8k2m4x0001`,
        })
    );

    console.log(`listo — los correos quedaron en ${salida}`);
})();
