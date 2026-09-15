"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { DEFAULT_PASSWORDS } from "@/lib/defaultPasswords";
import { revalidatePath } from "next/cache";
import { getEmailProvider } from "@/lib/email";
import { resolveSender } from "@/lib/email/sender";
import { preEnrollmentReceivedEmail } from "@/lib/email/templates/preEnrollmentReceived";
import {
    preEnrollmentAlertEmail,
    type SituacionDePreinscripcion,
} from "@/lib/email/templates/preEnrollmentAlert";
import { instituteBaseUrl } from "@/lib/tenant";

/** Lo que hace falta de la ficha del instituto para armar los correos (FEAT-20). */
const INSTITUTO_DEL_CORREO = {
    name: true,
    email: true,
    senderEmail: true,
    subdomain: true,
    customDomain: true,
} as const;

type InstitutoDelCorreo = {
    name: string;
    email: string | null;
    senderEmail: string | null;
    subdomain: string;
    customDomain: string | null;
};

/**
 * Cuántos acuses puede recibir una misma casilla en un día, y en cuántas horas
 * se cuenta (FEAT-20).
 *
 * **Esto no protege al formulario, protege al dominio del cliente.** Cualquiera
 * puede escribir acá la casilla de un tercero y hacer que salga un correo
 * firmado por el instituto; las quejas de spam caen sobre `senderEmail`, que es
 * el mismo dominio por el que sale la recuperación de contraseña, y degradan la
 * entrega de todo junto.
 *
 * **No se limita por IP**, aunque sería lo obvio: obligaría a guardar la IP de
 * cualquiera que pase por la pantalla, que es un dato personal que hoy el sistema
 * no guarda en ningún lado. Es el mismo criterio ya razonado en
 * [`passwordReset.ts`](../../lib/passwordReset.ts).
 *
 * El tope es suave a propósito: pasado el límite **la inscripción se guarda
 * igual** y lo único que no sale es el correo. Una familia con tres hijos
 * anotándose el mismo día es un caso real; un formulario que la rechace, no.
 */
const TOPE_POR_CASILLA = 3;
const VENTANA_DEL_TOPE_HORAS = 24;

function normalizar(direccion: string | null | undefined): string {
    return (direccion ?? "").trim().toLowerCase();
}

/**
 * A qué direcciones sale el acuse: la del alumno y la del tutor 1, las que haya.
 *
 * **A los dos, y no a uno u otro.** Cuando el alumno es menor los tutores son los
 * que pagan el curso, así que el tutor no puede quedar afuera; y un alumno de 15
 * con correo propio tampoco. El cuerpo está escrito en tercera persona
 * justamente para poder mandarles el mismo a los dos.
 *
 * **Hay que descartar repetidos**, y no es un caso raro: es muy común que la
 * madre ponga su misma dirección en el "Email Personal" del chico y otra vez en
 * el suyo. Sin esto le llegan dos correos idénticos.
 *
 * **Al tutor 2 no se le manda.** En el formulario está rotulado "Segundo Contacto
 * de Emergencia", y un acuse no es una emergencia.
 */
function destinatariosDelAcuse(
    emailAlumno: string | null,
    emailTutor1: string | null
): string[] {
    const vistos = new Set<string>();

    for (const candidato of [emailAlumno, emailTutor1]) {
        const clave = normalizar(candidato);
        if (clave) vistos.add(clave);
    }

    return [...vistos];
}

/**
 * Cuáles de esas casillas todavía están por debajo del tope.
 *
 * Se cuenta sobre las preinscripciones mismas y no sobre una tabla aparte: cada
 * formulario deja una fila con su fecha, así que "cuántas veces le escribimos a
 * esta casilla hoy" es una consulta y no una tabla nueva que mantener. Es el
 * mismo criterio que usa el límite de la recuperación de contraseña.
 *
 * **La fila recién creada entra en la cuenta**, porque esto corre después del
 * `create`. Con el tope en 3, el que no recibe correo es el cuarto.
 */
async function casillasHabilitadas(
    instituteId: string,
    direcciones: string[]
): Promise<string[]> {
    const desde = new Date(Date.now() - VENTANA_DEL_TOPE_HORAS * 60 * 60 * 1000);

    const cuentas = await Promise.all(
        direcciones.map((direccion) =>
            prisma.student.count({
                where: {
                    instituteId,
                    createdAt: { gte: desde },
                    OR: [{ email: direccion }, { guardian1Email: direccion }],
                },
            })
        )
    );

    return direcciones.filter((_, i) => cuentas[i] <= TOPE_POR_CASILLA);
}

const TIPO_DE_AVISO = "NEW_ENROLLMENT";

/**
 * Le avisa por la campana a quien puede hacer algo con esto.
 *
 * `unaVezPorDia` es para los avisos que salen de un **intento fallido**. Los de
 * una preinscripción nueva no lo necesitan —cada una es un hecho distinto—, pero
 * los otros dos sí: insistir en el formulario con el mismo DNI, o con el mismo
 * correo y DNIs inventados, le llenaría la campana al instituto. La llave son
 * **título y cuerpo juntos**, igual que en el aviso de la recuperación: el título
 * trae el nombre y el cuerpo el motivo, así que ninguno de los dos alcanza solo.
 */
async function avisarPorLaCampana(params: {
    instituteId: string;
    title: string;
    body: string;
    link: string;
    unaVezPorDia?: boolean;
}): Promise<void> {
    const { instituteId, title, body, link, unaVezPorDia } = params;

    if (unaVezPorDia) {
        const desde = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const yaAvisado = await prisma.notification.findFirst({
            where: { instituteId, type: TIPO_DE_AVISO, title, body, createdAt: { gte: desde } },
            select: { id: true },
        });

        if (yaAvisado) return;
    }

    const { createNotificationForRoles } = await import("@/app/actions/notifications");

    await createNotificationForRoles({
        instituteId,
        roles: ["ADMIN", "SECRETARY"],
        type: TIPO_DE_AVISO,
        title,
        body,
        link,
    });
}

/**
 * Los dos correos que salen de una preinscripción: el acuse a la familia
 * (FEAT-20) y el aviso al instituto (FEAT-12).
 *
 * **Salen juntos porque se enganchan en el mismo punto, no porque dependan uno
 * del otro**: si uno falla el otro se manda igual, y por eso van con
 * `allSettled` y no encadenados.
 *
 * **Nada de lo que pase acá adentro puede voltear la inscripción**, que a esta
 * altura ya está guardada. Quien llama envuelve esto en su propio `try`.
 */
async function mandarLosCorreos(params: {
    institute: InstitutoDelCorreo;
    instituteId: string;
    studentName: string;
    destinatarios: string[];
    situacion: SituacionDePreinscripcion;
    /**
     * A dónde manda el aviso al instituto, como ruta del campus.
     *
     * **No es siempre la pestaña de preinscriptos.** Un duplicado de alguien que
     * ya es alumno activo no aparece ahí, así que ese aviso lleva a su ficha:
     * mandarlo al listado lo dejaría mirando una lista donde esa persona no
     * figura.
     */
    link: string;
}): Promise<void> {
    const { institute, instituteId, studentName, destinatarios, situacion, link } = params;

    const habilitadas = await casillasHabilitadas(instituteId, destinatarios);

    const remitente = resolveSender(institute);
    const proveedor = getEmailProvider();

    const envios: Promise<unknown>[] = [];

    // Armar el HTML cuesta un `render` completo, así que no se arma cuando no hay
    // a quién mandárselo — que con este cliente va a ser la mitad de las veces.
    if (habilitadas.length > 0) {
        const acuse = await preEnrollmentReceivedEmail({
            instituteName: institute.name,
            studentName,
            puedeResponder: Boolean(institute.email),
        });

        envios.push(
            ...habilitadas.map((direccion) =>
                proveedor.send({ to: direccion, ...acuse, ...remitente })
            )
        );
    }

    // El aviso al instituto sale a `Institute.email`, el correo de contacto de la
    // ficha. **Si está vacío no sale nada** —el campo es opcional en el schema— y
    // el instituto se entera sólo por la campana, que es justo lo que FEAT-12
    // viene a arreglar. Vale la pena verificar que esté cargado.
    if (institute.email) {
        const aviso = await preEnrollmentAlertEmail({
            instituteName: institute.name,
            studentName,
            situacion,
            // Lo que decide si se le puede contestar por escrito o hay que llamar.
            // Es `destinatarios` y no `habilitadas`: el que quedó frenado por el
            // tope sí dejó una dirección.
            sinCorreo: destinatarios.length === 0,
            url: `${instituteBaseUrl(institute)}${link}`,
        });

        envios.push(proveedor.send({ to: institute.email, ...aviso, ...remitente }));
    }

    const resultados = await Promise.allSettled(envios);

    for (const resultado of resultados) {
        if (resultado.status === "rejected") {
            console.error("[inscription] falló un envío:", resultado.reason);
        }
    }
}

export async function createPreEnrollmentAction(formData: FormData, instituteId: string) {
    if (!instituteId) {
        return { success: false, error: "ID de instituto no proporcionado" };
    }

    try {
        const formType = formData.get("formType") as string;

        // Datos del Alumno
        const name = formData.get("name") as string;
        const birthDateStr = formData.get("birthDate") as string;
        const dni = formData.get("dni") as string;
        const phone = formData.get("phone") as string;
        const address = formData.get("address") as string;
        const email = formData.get("email") as string;
        const registeredLevel = formData.get("registeredLevel") as string;
        const schoolInfo = formData.get("schoolInfo") as string;

        // Tutor 1 (Opcional)
        const g1Name = formData.get("guardian1Name") as string || formData.get("g1Name") as string;
        const g1Relation = formData.get("guardian1Relation") as string || formData.get("g1Relation") as string;
        const g1Phone = formData.get("guardian1Phone") as string || formData.get("g1Phone") as string;
        const g1Email = formData.get("guardian1Email") as string || formData.get("g1Email") as string;

        // Tutor 2 (Opcional)
        const g2Name = formData.get("guardian2Name") as string || formData.get("g2Name") as string;
        const g2Relation = formData.get("guardian2Relation") as string || formData.get("g2Relation") as string;
        const g2Phone = formData.get("guardian2Phone") as string || formData.get("g2Phone") as string;
        const g2Email = formData.get("guardian2Email") as string || formData.get("g2Email") as string;

        if (!name) {
            return { success: false, error: "El nombre es obligatorio" };
        }

        if (!dni) {
            return { success: false, error: "El DNI es obligatorio" };
        }

        if (formType === "minor") {
            if (!g1Name || !g1Phone) {
                return { success: false, error: "Para inscripciones de menores, los datos del tutor son obligatorios" };
            }
        }

        const institute = await prisma.institute.findUnique({
            where: { id: instituteId },
            select: INSTITUTO_DEL_CORREO,
        });

        if (!institute) {
            return { success: false, error: "El instituto no existe" };
        }

        const destinatarios = destinatariosDelAcuse(email, g1Email);
        const sinCorreo = destinatarios.length === 0;

        // Para pre-inscripciones públicas, usamos una contraseña genérica
        const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORDS.INSCRIPTION, 10);

        const parsedBirthDate = (birthDateStr && !isNaN(Date.parse(birthDateStr))) ? new Date(birthDateStr) : null;

        await prisma.student.create({
            data: {
                name,
                email: normalizar(email) || null,
                password: hashedPassword,
                hasDefaultPassword: true,
                phone: phone || null,
                birthDate: parsedBirthDate,
                dni: dni || null,
                address: address || null,
                schoolInfo: schoolInfo || null,
                registeredLevel: registeredLevel || null,
                status: "PRE_INSCRIBED",

                guardian1Name: g1Name || null,
                guardian1Relation: g1Relation || null,
                guardian1Phone: g1Phone || null,
                guardian1Email: normalizar(g1Email) || null,

                guardian2Name: g2Name || null,
                guardian2Relation: g2Relation || null,
                guardian2Phone: g2Phone || null,
                guardian2Email: normalizar(g2Email) || null,

                instituteId: instituteId,
            }
        });

        revalidatePath("/students");

        // 🔔 Crear notificación en DB usando el nuevo sistema para Roles
        try {
            const levelLabel = registeredLevel ? ` — Nivel: ${registeredLevel}` : "";

            // **El "sin correo" va acá y no sólo en el correo al instituto**: es
            // el único aviso que llega cuando `Institute.email` está vacío, y es
            // justo la familia a la que hay que llamar por teléfono porque no
            // recibió ningún acuse.
            const faltaCorreo = sinCorreo ? " · sin correo de contacto" : "";

            await avisarPorLaCampana({
                instituteId,
                title: "Nueva pre-inscripción recibida",
                body: `${name}${levelLabel} se pre-inscribió al instituto${faltaCorreo}`,
                link: "/students?tab=pre-enrolled",
            });
        } catch (notifErr) {
            console.error("Error creating pre-enrollment notification:", notifErr);
        }

        // Un correo caído no puede voltear una inscripción que ya está guardada.
        try {
            await mandarLosCorreos({
                institute,
                instituteId,
                studentName: name,
                destinatarios,
                situacion: "nueva",
                link: "/students?tab=pre-enrolled",
            });
        } catch (mailErr) {
            console.error("[inscription] falló el envío de la preinscripción:", mailErr);
        }

        return { success: true };
    } catch (e) {
        console.error("Error in pre-enrollment:", e);
        // **Cuál de las dos restricciones saltó se averigua contra la base, no
        // leyendo `e.meta.target`.** Cuando la misma persona se vuelve a anotar
        // con el mismo DNI **y** el mismo correo se violan las dos a la vez, y
        // Postgres reporta la que pega primero: si venía la del correo, este
        // camino le contestaba "ese correo ya está registrado" y le filtraba
        // que ya estaba en el instituto — justo lo que el acuse neutro existe
        // para no filtrar.
        if (esViolacionDeUnico(e)) {
            return manejarChoque(formData, instituteId);
        }
        return { success: false, error: "Error al procesar la inscripción. Intente nuevamente." };
    }
}

/** El `P2002` de Prisma: chocó contra una restricción única. */
function esViolacionDeUnico(e: unknown): boolean {
    return typeof e === "object" && e !== null && "code" in e && e.code === "P2002";
}

/**
 * El `create` chocó con una restricción única. Hay dos causas, y no se le
 * contesta lo mismo a cada una (FEAT-20).
 *
 * **Cuál fue se pregunta contra la base y no se lee de `e.meta.target`.** Cuando
 * la misma persona se vuelve a anotar con el mismo DNI y el mismo correo se
 * violan las dos a la vez, y cuál reporta Postgres no está bajo nuestro control.
 *
 * - **El DNI ya existe** → es la misma persona, y se le contesta **exactamente lo
 *   mismo que a cualquiera que se anota**: la misma pantalla y el mismo correo. No
 *   se le miente —su formulario llegó de verdad—, y el que estaba probando DNIs no
 *   aprende nada, porque la respuesta es idéntica en los dos casos. Hasta ahora la
 *   pantalla le decía *"El DNI del alumno ya se encuentra registrado"*, que
 *   convertía al formulario en una forma de averiguar quién es alumno del
 *   instituto. **La verdad completa va al instituto**, distinguiendo cuál de los
 *   tres estados es: el activo probablemente quiere otra cosa, el dado de baja
 *   quiere volver ([FIN-30](../../../docs/BACKLOG-TECNICO.md)), y el que ya estaba
 *   preinscripto está esperando una respuesta que no llegó.
 *
 * - **El correo ya lo usa otro alumno** → son dos personas distintas compartiendo
 *   una casilla, y la inscripción **no se guarda**: `Student.email` es único por
 *   instituto porque el login del alumno lo acepta como identificador
 *   ([`auth.ts`](../../lib/auth.ts)), así que dos filas con el mismo correo harían
 *   que entrara uno a la ficha del otro. A la persona se le muestra el error, que
 *   es recuperable —puede preguntarle al instituto—, pero **el instituto se entera
 *   igual por la campana**: sin eso, ésta es la única puerta del formulario donde
 *   un intento se pierde sin que nadie lo sepa.
 */
async function manejarChoque(formData: FormData, instituteId: string) {
    const errorDeCorreo = {
        success: false as const,
        error: "El correo electrónico del alumno ya se encuentra registrado en este instituto.",
    };

    const name = (formData.get("name") as string) ?? "";
    const dni = (formData.get("dni") as string) ?? "";
    const email = formData.get("email") as string;
    const g1Email = (formData.get("guardian1Email") as string) || (formData.get("g1Email") as string);
    const correo = normalizar(email);

    try {
        const [institute, enConflicto] = await Promise.all([
            prisma.institute.findUnique({
                where: { id: instituteId },
                select: INSTITUTO_DEL_CORREO,
            }),
            prisma.student.findMany({
                where: {
                    instituteId,
                    OR: [{ dni }, ...(correo ? [{ email: correo }] : [])],
                },
                select: { id: true, name: true, status: true, dni: true, email: true },
                take: 2,
            }),
        ]);

        const mismaPersona = enConflicto.find((s) => s.dni === dni);

        if (!mismaPersona) {
            const duenoDelCorreo = enConflicto.find((s) => s.email === correo);

            // Ninguna de las dos: el choque fue con algo que no sabemos leer.
            // Mejor el mensaje genérico que inventar un motivo.
            if (!duenoDelCorreo) {
                return { success: false, error: "El alumno ya se encuentra registrado en el sistema." };
            }

            try {
                await avisarPorLaCampana({
                    instituteId,
                    title: `${name} no pudo anotarse`,
                    // **La dirección va en el cuerpo, y es lo primero.** Sin ella
                    // hay que abrir la ficha del otro alumno para saber de qué
                    // correo se está hablando, y lo que el instituto necesita para
                    // llamar a Marcos es justamente eso. Que "no se guardó" ya lo
                    // dice el título, así que no se repite: la campana recorta el
                    // cuerpo a dos líneas y el lugar se paga.
                    body: `Quiso usar ${correo}, que ya está en la ficha de otro alumno. Hay que pedirle otra dirección, o cargarla a mano.`,
                    link: `/students/${duenoDelCorreo.id}`,
                    unaVezPorDia: true,
                });
            } catch (notifErr) {
                console.error("Error creating email-collision notification:", notifErr);
            }

            return errorDeCorreo;
        }

        if (!institute) return { success: true as const };

        const situacion: SituacionDePreinscripcion =
            mismaPersona.status === "DELETED"
                ? "ya-de-baja"
                : mismaPersona.status === "PRE_INSCRIBED"
                  ? "ya-preinscripto"
                  : "ya-activo";

        const destinatarios = destinatariosDelAcuse(email, g1Email);
        const dondeSeArregla = `/students/${mismaPersona.id}`;

        try {
            await avisarPorLaCampana({
                instituteId,
                // El nombre va en el título y no en el cuerpo: la campana recorta
                // el cuerpo a dos líneas y no recorta el título, así que un nombre
                // largo adentro del cuerpo se come el motivo, que es lo que hay
                // que leer.
                title: `${name} volvió a completar el formulario`,
                body:
                    situacion === "ya-de-baja"
                        ? "Ya tiene una ficha dada de baja. No se creó una nueva."
                        : situacion === "ya-preinscripto"
                          ? "Ya tenía una preinscripción sin atender. No se creó una nueva."
                          : "Ya figura como alumno activo. No se creó una ficha nueva.",
                link: dondeSeArregla,
                unaVezPorDia: true,
            });
        } catch (notifErr) {
            console.error("Error creating duplicate pre-enrollment notification:", notifErr);
        }

        try {
            await mandarLosCorreos({
                institute,
                instituteId,
                studentName: name,
                destinatarios,
                situacion,
                link: dondeSeArregla,
            });
        } catch (mailErr) {
            console.error("[inscription] falló el envío del duplicado:", mailErr);
        }

        return { success: true as const };
    } catch (error) {
        console.error("[inscription] falló el manejo del choque:", error);

        // **El error neutro, y no el acuse.** Si algo se cayó acá no sabemos cuál
        // de las dos causas fue: contestar "ese correo ya está registrado"
        // filtraría lo que el acuse existe para no filtrar, y contestar el acuse
        // sería peor todavía — la persona se iría creyendo que se anotó cuando no
        // se creó ninguna fila y nadie va a llamarla. "Volvé a intentar" no revela
        // nada y la deja sabiendo que tiene que hacer algo.
        return { success: false as const, error: "Error al procesar la inscripción. Intente nuevamente." };
    }
}
