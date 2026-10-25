"use server";

import prisma from "@/lib/prisma";
import { getAuthContext, INSTITUTE_ADMINS, type AuthContext } from "@/lib/authz";
import { feeAfterPayment } from "@/lib/feePayment";
import { formatFeeLabel } from "@/lib/utils";

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
                        },
                        enrollment: { select: { course: { select: { name: true } } } }
                    }
                }
            }
        });

        if (!payment) return { success: false, error: "Pago no encontrado" };
        if (payment.fee.instituteId !== ctx.instituteId) return { success: false, error: "Acceso denegado" };
        if (!(await canSeeReceipt(ctx, payment.fee.studentId))) {
            return { success: false, error: "Acceso denegado" };
        }

        // Cómo quedó la cuota **con este pago**, no cómo está hoy: el recibo del
        // primero de tres pagos tiene que seguir diciendo lo que faltaba entonces,
        // aunque se lo baje después del tercero. Por eso se cuenta lo pagado con los
        // pagos válidos anteriores a éste y no con el `paidAmount` de la cuota. FIN-31.
        const earlier = await prisma.payment.findMany({
            where: {
                feeId: payment.feeId,
                status: "VALID",
                OR: [
                    { date: { lt: payment.date } },
                    { date: payment.date, id: { lt: payment.id } }
                ]
            },
            select: { amount: true, discount: true, surcharge: true }
        });
        const price = payment.fee.originalAmount;
        const paidBefore = Math.min(
            price,
            earlier.reduce((total, p) => total + p.amount + p.discount - p.surcharge, 0)
        );
        const after = feeAfterPayment({ originalAmount: price, paidAmount: paidBefore }, payment);

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
                studentName: payment.fee.student.name,
                studentAddress: payment.fee.student.address
            },
            fee: {
                // Con el curso: un alumno con dos inscripciones tiene dos cuotas del mismo mes (FIN-33).
                label: [
                    formatFeeLabel(payment.fee.type, payment.fee.month, payment.fee.year),
                    payment.fee.enrollment?.course.name
                ].filter(Boolean).join(" - "),
                price,
                paidBefore,
                /** Lo que este pago le descontó a la cuota, con su descuento adentro. */
                appliedNow: after.paidAmount - paidBefore,
                pendingAfter: after.remaining,
                surplus: after.surplus
            },
            institute
        };
    } catch (e: any) {
        console.error(e);
        return { success: false, error: "Error al cargar datos del recibo" };
    }
}
