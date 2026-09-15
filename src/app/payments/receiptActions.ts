"use server";

import prisma from "@/lib/prisma";
import { getAuthContext, INSTITUTE_ADMINS, type AuthContext } from "@/lib/authz";

/**
 * Los datos del recibo de un pago, para las cuatro pantallas que lo ofrecen: la
 * caja y la ficha del alumno (personal del instituto), la cuenta corriente del
 * tutor y la del alumno mayor de edad.
 *
 * **Vive fuera de `actions.ts` a propósito.** Ese módulo es la caja: todo lo que
 * está adentro entra por `getAuthAndInstitute()`, que exige ADMIN o SECRETARY, y
 * así tiene que seguir. Ésta es la única acción del módulo que **lee** en nombre
 * de alguien de afuera del instituto, y la última vez que estuvo mezclada con el
 * resto se fue con el lote: el barrido de permisos de SEC-03 le aplicó el mismo
 * `requireRole` que a los quince cobros, y tutores y alumnos se quedaron sin
 * recibo (BUG-16). Si el próximo barrido pasa por acá, que tenga que abrir este
 * archivo para hacerlo.
 */

/**
 * Quién puede ver el recibo de un pago del alumno `studentId`.
 *
 * **El corte es por vínculo, no por rol.** Agregar GUARDIAN y STUDENT a una
 * lista de roles dejaría como único filtro el del instituto, que con un solo
 * instituto no filtra nada: el `paymentId` viaja en el cuerpo del POST y
 * cualquier tutor podría pedir el recibo de otra familia —nombre, domicilio e
 * importe— mandando un id que no es suyo.
 *
 * El personal ya quedó acotado por el chequeo de instituto de quien llama. El
 * profesor no entra, que es lo que las pantallas ya muestran: en la ficha del
 * alumno, `canSeeFinancials` es `isAdmin || isGuardian`.
 */
async function canSeeReceipt(ctx: AuthContext, studentId: string): Promise<boolean> {
    if (ctx.isStudent) return ctx.userId === studentId;

    if ((INSTITUTE_ADMINS as readonly string[]).includes(ctx.activeRole)) return true;

    if (ctx.activeRole === "GUARDIAN") {
        const link = await prisma.guardianStudentLink.findUnique({
            where: {
                guardianId_studentId: { guardianId: ctx.userId, studentId }
            },
            select: { id: true }
        });
        return link !== null;
    }

    return false;
}

export async function getReceiptDataAction(paymentId: string) {
    const ctx = await getAuthContext();
    // SUPERADMIN queda afuera como siempre: no tiene instituto y no cobra.
    if (!ctx || !ctx.instituteId) return { success: false, error: "No autorizado" };

    try {
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
            include: {
                fee: {
                    include: {
                        student: {
                            select: {
                                name: true,
                                address: true
                            }
                        }
                    }
                }
            }
        });

        if (!payment) return { success: false, error: "Pago no encontrado" };
        if (payment.fee.instituteId !== ctx.instituteId) return { success: false, error: "Acceso denegado" };
        if (!(await canSeeReceipt(ctx, payment.fee.studentId))) {
            return { success: false, error: "Acceso denegado" };
        }

        const institute = await prisma.institute.findUnique({
            where: { id: ctx.instituteId },
            select: {
                name: true,
                address: true,
                phone: true,
                cuit: true,
                grossIncome: true,
                activityStartDate: true,
                logoUrl: true
            }
        });

        return {
            success: true,
            payment: {
                id: payment.id,
                amount: payment.amount,
                surcharge: payment.surcharge,
                discount: payment.discount,
                date: payment.date,
                feeType: payment.fee.type,
                feeMonth: payment.fee.month,
                feeYear: payment.fee.year,
                studentName: payment.fee.student.name,
                studentAddress: payment.fee.student.address
            },
            institute
        };
    } catch (e: any) {
        console.error(e);
        return { success: false, error: "Error al cargar datos del recibo" };
    }
}
