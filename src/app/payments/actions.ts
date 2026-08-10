"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/authz";

/**
 * Finanzas es de administración y secretaría, que es lo que ya decide el menú.
 * Antes el chequeo era `user.role !== "SUPERADMIN"`: una lista negra de uno solo,
 * que dejaba pasar a profesores y tutores. Los server actions son endpoints POST
 * reales, así que ocultar el botón no alcanzaba.
 *
 * Devuelve la forma que ya esperaban los llamadores; la decisión vive en
 * `requireRole`.
 */
async function getAuthAndInstitute() {
    const auth = await requireRole(["ADMIN", "SECRETARY"]);
    if (!auth) return null;
    return { id: auth.userId, instituteId: auth.instituteId };
}

/**
 * Bloqueos de fila para las operaciones de cobro.
 *
 * Los importes de una cuota no se pueden calcular con `increment`: `paidAmount`
 * está topeado en el importe de la cuota y lo que sobra va al saldo del alumno,
 * así que hay que leer, decidir y recién ahí escribir. Ese "leer y después
 * escribir" es una condición de carrera: dos cobros simultáneos sobre la misma
 * cuota leían el mismo `paidAmount` y el segundo pisaba al primero, que
 * desaparecía sin dejar rastro. Un doble clic alcanza.
 *
 * El lock se toma al principio de la transacción y se libera al commit, así que
 * la segunda operación espera turno y vuelve a leer los valores ya actualizados.
 * Se prefiere esto a `isolationLevel: "Serializable"` porque Postgres resuelve
 * los conflictos serializables abortando una de las dos transacciones: sin un
 * reintento, el cobro perdido se transforma en un error inexplicable para quien
 * está cobrando.
 *
 * **El orden es siempre Payment → Fee → Enrollment.** Respetarlo es lo que evita
 * que dos acciones que tocan las mismas filas en distinto orden queden trabadas
 * esperándose entre sí. `Student` no aparece: el saldo a favor se mueve con
 * `updateMany` condicionales, que son atómicos y no necesitan lock.
 */
function lockPayment(tx: Prisma.TransactionClient, paymentId: string) {
    return tx.$queryRaw`SELECT id FROM "Payment" WHERE id = ${paymentId} FOR UPDATE`;
}

function lockFee(tx: Prisma.TransactionClient, feeId: string) {
    return tx.$queryRaw`SELECT id FROM "Fee" WHERE id = ${feeId} FOR UPDATE`;
}

function lockEnrollment(tx: Prisma.TransactionClient, enrollmentId: string) {
    return tx.$queryRaw`SELECT id FROM "Enrollment" WHERE id = ${enrollmentId} FOR UPDATE`;
}

/**
 * Margen de las transacciones que toman locks.
 *
 * Los valores por defecto de Prisma (2s esperando conexión, 5s de transacción)
 * quedan justos ahora que una operación puede tener que esperar turno. Pero
 * agrandarlos sin techo no sirve: la función de Vercel tiene su propio límite de
 * duración y muere antes, así que un `timeout` más largo que ese límite no se
 * cumple nunca — sólo cambia quién corta.
 *
 * Con Vercel y Supabase en la misma región la transacción en sí tarda
 * milisegundos; estos segundos son margen para la espera del lock, y la suma de
 * los dos entra dentro del presupuesto de la función.
 */
const COLLECTION_TX_OPTIONS = { maxWait: 3000, timeout: 6000 };

export async function createPaymentAction(formData: FormData) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    const feeId = formData.get("feeId") as string;
    const amountStr = formData.get("amount") as string;
    const surchargeStr = formData.get("surcharge") as string;
    const discountStr = formData.get("discount") as string;
    const method = formData.get("method") as string;
    const notes = formData.get("notes") as string;

    const amount = parseFloat(amountStr);
    const surcharge = parseFloat(surchargeStr) || 0;
    const discount = parseFloat(discountStr) || 0;

    if (!feeId || isNaN(amount) || amount <= 0) {
        return { success: false, error: "Datos del pago inválidos" };
    }

    // El capital que realmente se acredita a la deuda es:
    // Lo que pagó + lo que se le perdonó - lo que es recargo (interés)
    const capitalContribution = amount + discount - surcharge;

    try {
        // La cuota se lee **dentro** de la transacción y con la fila bloqueada: antes
        // se leía afuera, se calculaba en memoria y adentro se escribía el valor
        // absoluto, así que dos cobros simultáneos se pisaban. Ver `lockFee`.
        const result = await prisma.$transaction(async (tx) => {
            await lockFee(tx, feeId);

            // 1. Obtener la Cuota (Fee)
            // El instituto va en el `where`, no en un `if` posterior: así no hay forma
            // de olvidarse el chequeo al tocar esto más adelante. Una cuota de otro
            // instituto simplemente no existe para este usuario.
            const fee = await tx.fee.findFirst({
                where: { id: feeId, instituteId: user.instituteId },
            });

            if (!fee) return { success: false, error: "Cuota no encontrada" } as const;

            const totalPaidAfter = fee.paidAmount + capitalContribution;
            const surplus = totalPaidAfter > fee.originalAmount ? totalPaidAfter - fee.originalAmount : 0;
            const finalPaidAmountOnFee = Math.min(totalPaidAfter, fee.originalAmount);

            // 2. Crear el pago, actualizar la cuota y manejar el saldo a favor
            // Crear el registro de transacción individual con los ajustes
            const payment = await tx.payment.create({
                data: {
                    feeId,
                    amount,
                    surcharge,
                    discount,
                    method,
                    notes: surplus > 0 ? `${notes || ""} (Excedente de $${surplus.toLocaleString()} acreditado a saldo)`.trim() : notes,
                    date: new Date()
                }
            });

            // Asiento en el Libro Mayor
            await tx.transaction.create({
                data: {
                    instituteId: user.instituteId as string,
                    amount: amount, // El pago real que ingresó
                    type: "PAYMENT",
                    method,
                    date: new Date(),
                    description: `Pago Cuota/Matrícula - Estudiante ID: ${fee.studentId}`,
                    paymentId: payment.id,
                    operatorId: user.id
                }
            });

            // Determinar nuevo estado (basado en el capital cubierto)
            let newStatus: any = "PARTIAL";
            if (finalPaidAmountOnFee >= fee.originalAmount) {
                newStatus = "PAID";
            }

            // Actualizar el "Snapshot" de la cuota
            await tx.fee.update({
                where: { id: feeId },
                data: {
                    paidAmount: finalPaidAmountOnFee,
                    status: newStatus,
                    datePaid: newStatus === "PAID" ? new Date() : fee.datePaid
                }
            });

            // Si hay excedente, lo sumamos al balance del alumno
            if (surplus > 0) {
                await tx.student.update({
                    where: { id: fee.studentId },
                    data: {
                        creditBalance: { increment: surplus }
                    }
                });
            }

            return { success: true } as const;
        }, COLLECTION_TX_OPTIONS);

        if (!result.success) return result;

        revalidatePath("/payments");
        revalidatePath("/payments/debtors");
        revalidatePath("/students");
        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { success: false, error: "Error al registrar el pago" };
    }
}

export async function getStudentPendingFeesAction(studentId: string) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    try {
        const [fees, student] = await Promise.all([
            prisma.fee.findMany({
                where: {
                    studentId,
                    status: { in: ["PENDING", "PARTIAL"] },
                    originalAmount: { gt: 0 },
                    instituteId: user.instituteId as string
                },
                include: {
                    enrollment: {
                        include: { course: { select: { name: true } } }
                    }
                },
                orderBy: [
                    { year: "desc" },
                    { month: "desc" }
                ]
            }),
            // Las cuotas ya filtran por instituto; el saldo también tiene que
            // hacerlo, o se filtra el de un alumno ajeno cuando no hay cuotas.
            prisma.student.findFirst({
                where: { id: studentId, instituteId: user.instituteId },
                select: { creditBalance: true }
            })
        ]);

        return { success: true, fees, creditBalance: student?.creditBalance || 0 };
    } catch (e: any) {
        return { success: false, error: "Error al cargar cuotas pendientes" };
    }
}

export async function getStudentActiveEnrollmentsAction(studentId: string) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    try {
        const enrollments = await prisma.enrollment.findMany({
            where: {
                studentId,
                status: "ACTIVE",
                course: { instituteId: user.instituteId as string }
            },
            include: {
                course: {
                    select: { id: true, name: true, monthlyPrice: true }
                }
            }
        });
        return { success: true, enrollments };
    } catch (e: any) {
        return { success: false, error: "Error al obtener inscripciones" };
    }
}

export async function registerFullCoursePaymentAction(formData: FormData) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    const studentId = formData.get("studentId") as string;
    const enrollmentId = formData.get("enrollmentId") as string;
    const amountStr = formData.get("amount") as string;
    const discountStr = formData.get("discount") as string;
    const method = formData.get("method") as string;
    const notes = formData.get("notes") as string;

    const originalAmount = parseFloat(amountStr);
    const discount = parseFloat(discountStr) || 0;
    const paidCapital = Math.max(0, originalAmount - discount);

    if (!studentId || !enrollmentId || isNaN(originalAmount) || originalAmount <= 0) {
        return { success: false, error: "Datos del pago inválidos" };
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            // Se bloquea la inscripción, no la cuota: la cuota `FULL_COURSE` puede
            // todavía no existir, y es justamente el caso que hay que serializar. Dos
            // registraciones simultáneas de la misma inscripción creaban dos cuotas.
            await lockEnrollment(tx, enrollmentId);

            const enrollment = await tx.enrollment.findUnique({
                where: { id: enrollmentId },
                include: { course: true }
            });

            if (!enrollment || enrollment.course.instituteId !== user.instituteId) {
                return { success: false, error: "Inscripción no encontrada" } as const;
            }

            const currentYear = new Date().getFullYear();

            // La búsqueda de la cuota existente va adentro de la transacción: afuera
            // ahorraba unos milisegundos a cambio de decidir sobre datos viejos.
            const existingFee = await tx.fee.findFirst({
                where: {
                    enrollmentId,
                    type: "FULL_COURSE"
                }
            });

            // Update enrollment to FULL_COURSE
            await tx.enrollment.update({
                where: { id: enrollmentId },
                data: {
                    billingMode: "FULL_COURSE",
                    customFullCoursePrice: originalAmount
                }
            });

            let feeId = existingFee?.id;

            if (!feeId) {
                const createdFee = await tx.fee.create({
                    data: {
                        studentId,
                        enrollmentId,
                        type: "FULL_COURSE",
                        originalAmount,
                        paidAmount: originalAmount,
                        status: "PAID",
                        month: new Date().getMonth() + 1,
                        year: currentYear,
                        datePaid: new Date(),
                        instituteId: user.instituteId as string
                    }
                });
                feeId = createdFee.id;
            } else {
                await tx.fee.update({
                    where: { id: feeId },
                    data: {
                        originalAmount,
                        paidAmount: originalAmount,
                        status: "PAID",
                        datePaid: new Date()
                    }
                });
            }

            // Create Payment
            const payment = await tx.payment.create({
                data: {
                    feeId,
                    amount: paidCapital,
                    discount,
                    surcharge: 0,
                    method,
                    notes: notes || "Pago Único Completo de Curso",
                    date: new Date()
                }
            });

            // Create Transaction in Ledger
            await tx.transaction.create({
                data: {
                    instituteId: user.instituteId as string,
                    amount: paidCapital,
                    type: "PAYMENT",
                    method,
                    date: new Date(),
                    description: `Pago Único Curso Completo (${enrollment.course.name}) - Estudiante ID: ${studentId}`,
                    paymentId: payment.id,
                    operatorId: user.id
                }
            });

            return { success: true } as const;
        }, COLLECTION_TX_OPTIONS);

        if (!result.success) return result;

        revalidatePath("/payments");
        revalidatePath("/payments/debtors");
        revalidatePath(`/students/${studentId}`);
        return { success: true };
    } catch (e: any) {
        console.error("Error al registrar pago único:", e);
        return { success: false, error: "Error al registrar el pago único" };
    }
}

export async function createExpenseAction(formData: FormData) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    const description = formData.get("description") as string;
    const amountStr = formData.get("amount") as string;
    const category = formData.get("category") as string;
    const dateStr = formData.get("date") as string;
    const ticketNumber = formData.get("ticketNumber") as string;

    const recipientId = formData.get("recipientId") as string;

    const amount = parseFloat(amountStr);

    if (!description || isNaN(amount) || amount <= 0) {
        return { success: false, error: "Descripción y un monto mayor a 0 son obligatorios" };
    }

    try {
        await prisma.$transaction(async (tx) => {
            const exp = await tx.expense.create({
                data: {
                    description: description.trim(),
                    amount,
                    category: category || "OTROS",
                    ticketNumber: ticketNumber?.trim() || null,
                    date: dateStr ? new Date(`${dateStr}T00:00:00Z`) : new Date(),
                    instituteId: user.instituteId as string,
                    recipientId: recipientId || null
                }
            });

            await tx.transaction.create({
                data: {
                    instituteId: user.instituteId as string,
                    amount: -amount, // Salida de dinero
                    type: category === "Payroll" ? "PAYROLL" : "EXPENSE",
                    method: "EFECTIVO", // Por defecto
                    date: exp.date,
                    description: `Gasto: ${exp.category} ${exp.ticketNumber ? '- Ticket: '+exp.ticketNumber : ''}`,
                    expenseId: exp.id,
                    operatorId: user.id
                }
            });
        });

        revalidatePath("/payments");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: "Error al cargar gasto operativo" };
    }
}

export async function voidExpenseAction(expenseId: string, reason?: string) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    try {
        await prisma.$transaction(async (tx) => {
            const expense = await tx.expense.findFirst({
                where: { id: expenseId, instituteId: user.instituteId as string }
            });

            if (!expense) throw new Error("Gasto no encontrado");
            if (expense.status === "VOIDED") throw new Error("El gasto ya está anulado");

            // Marcar gasto como anulado
            await tx.expense.update({
                where: { id: expense.id },
                data: { status: "VOIDED" }
            });

            // Marcar transacción original como anulada
            await tx.transaction.updateMany({
                where: { expenseId: expense.id },
                data: { status: "VOIDED" }
            });

            // Generar contra-asiento
            await tx.transaction.create({
                data: {
                    instituteId: user.instituteId as string,
                    amount: expense.amount, // Positivo para compensar el gasto negativo original
                    type: "ADJUSTMENT",
                    method: "EFECTIVO",
                    date: new Date(),
                    description: `Anulación de Gasto #${expense.id.slice(-6)}`,
                    expenseId: expense.id,
                    operatorId: user.id
                }
            });

            // Desmarcar lecciones asociadas al expense anulado
            // para que vuelvan a aparecer como pendientes en la próxima liquidación
            await tx.lesson.updateMany({
                where: { expenseId: expense.id },
                data: { expenseId: null }
            });
        });

        revalidatePath("/payments");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message || "Error al anular el gasto" };
    }
}

export async function createIncomeAction(formData: FormData) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    const description = formData.get("description") as string;
    const amountStr = formData.get("amount") as string;
    const category = formData.get("category") as string;
    const dateStr = formData.get("date") as string;
    const method = formData.get("method") as string;
    const ticketNumber = formData.get("ticketNumber") as string;
    const studentId = formData.get("studentId") as string;

    const amount = parseFloat(amountStr);

    if (!description || isNaN(amount) || amount <= 0) {
        return { success: false, error: "Descripción y un monto mayor a 0 son obligatorios" };
    }

    try {
        await prisma.$transaction(async (tx) => {
            const inc = await tx.miscellaneousIncome.create({
                data: {
                    description: description.trim(),
                    amount,
                    category: category || "OTROS",
                    method: method || "EFECTIVO",
                    ticketNumber: ticketNumber?.trim() || null,
                    date: dateStr ? new Date(`${dateStr}T00:00:00Z`) : new Date(),
                    instituteId: user.instituteId as string,
                    studentId: studentId || null
                }
            });

            await tx.transaction.create({
                data: {
                    instituteId: user.instituteId as string,
                    amount: amount,
                    type: "MISC_INCOME",
                    method: inc.method,
                    date: inc.date,
                    description: `Ingreso: ${inc.category} ${inc.ticketNumber ? '- '+inc.ticketNumber : ''}`,
                    miscIncomeId: inc.id,
                    operatorId: user.id
                }
            });
        });

        revalidatePath("/payments");
        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { success: false, error: "Error al registrar el ingreso extra" };
    }
}

export async function generateStandaloneEnrollmentFeeAction(formData: FormData) {
    // Tenía su propia variante inline que sólo pedía estar logueado y tener
    // instituto: cualquier usuario del instituto podía emitir una matrícula.
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "Sin permisos" };

    const studentId = formData.get("studentId") as string;
    const year = parseInt(formData.get("year") as string);
    const amount = parseFloat(formData.get("amount") as string);

    if (!studentId || isNaN(year) || isNaN(amount)) {
        return { success: false, error: "Datos incompletos" };
    }

    try {
        // Verificar si ya existe una matrícula de este tipo para este año (para evitar duplicados accidentales)
        const existing = await prisma.fee.findFirst({
            where: {
                studentId,
                year,
                type: "ENROLLMENT",
                instituteId: user.instituteId
            }
        });

        if (existing) {
            return { success: false, error: `Ya existe una matrícula registrada para este alumno en el año ${year}` };
        }

        await prisma.fee.create({
            data: {
                studentId,
                year,
                month: new Date().getMonth() + 1, // Mes administrativo de creación
                type: "ENROLLMENT",
                originalAmount: amount,
                paidAmount: 0,
                status: "PENDING",
                instituteId: user.instituteId
            }
        });

        revalidatePath("/payments");
        return { success: true };
    } catch (e) {
        return { success: false, error: "Error al generar la matrícula" };
    }
}

/**
 * Capital que un pago le descuenta a la deuda: lo que entró, más lo que se perdonó,
 * menos el recargo (que es interés, no capital). Misma cuenta que hace
 * `createPaymentAction` con los datos del formulario.
 */
function capitalOf(payment: { amount: number; surcharge: number; discount: number }) {
    return payment.amount + payment.discount - payment.surcharge;
}

export async function voidPaymentAction(paymentId: string, reason?: string) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    try {
        await prisma.$transaction(async (tx) => {
            // Sin el lock del pago, dos anulaciones simultáneas leen `VALID` las dos y
            // se cuentan por duplicado: dos contra-asientos y el saldo tocado dos veces.
            // Sin el de la cuota, un cobro en paralelo deja el `paidAmount` mal.
            await lockPayment(tx, paymentId);

            const payment = await tx.payment.findUnique({ where: { id: paymentId } });

            if (!payment) throw new Error("Pago no encontrado");
            if (payment.status === "VOIDED") throw new Error("El pago ya fue anulado");

            // La cuota se lee después de bloquearla, no con un `include` en la consulta
            // anterior: leerla antes del lock es leer un valor que otra transacción
            // todavía puede cambiar.
            await lockFee(tx, payment.feeId);

            const fee = await tx.fee.findUnique({ where: { id: payment.feeId } });

            if (!fee) throw new Error("Cuota no encontrada");
            if (fee.instituteId !== user.instituteId) throw new Error("Acceso denegado");

            // El excedente es una propiedad de la cuota entera, no de un pago suelto:
            // `max(0, capital cobrado - importe de la cuota)`. Lo que este pago aportó al
            // saldo a favor es, entonces, cuánto baja ese excedente al sacarlo del medio.
            // Se recalcula desde los pagos VALID en vez de guardarlo en el Payment porque
            // así también sirve para los pagos ya registrados, que no tendrían el dato.
            const remainingPayments = await tx.payment.findMany({
                where: { feeId: payment.feeId, status: "VALID", id: { not: payment.id } },
                select: { amount: true, surcharge: true, discount: true }
            });

            const capitalAfter = remainingPayments.reduce((total, p) => total + capitalOf(p), 0);
            const capitalBefore = capitalAfter + capitalOf(payment);
            const surplusAfter = Math.max(0, capitalAfter - fee.originalAmount);
            const surplusBefore = Math.max(0, capitalBefore - fee.originalAmount);

            // Un pago con método SALDO no fue plata que entró: fue crédito que salió.
            // Anularlo se lo devuelve al alumno.
            const creditReturned = payment.method === "SALDO" ? payment.amount : 0;
            const creditDelta = creditReturned - (surplusBefore - surplusAfter);

            if (creditDelta !== 0) {
                // El saldo no puede quedar negativo: sería una deuda que la UI no muestra
                // en ningún lado. Si ya se consumió, la anulación se traba hasta que se
                // anulen los pagos que lo gastaron.
                //
                // La condición viaja en el `where` en lugar de chequearse antes: así el
                // control y el descuento son una sola operación atómica y dos anulaciones
                // simultáneas sobre el mismo alumno no pueden pasar las dos.
                //
                // La tolerancia de medio centavo es por los montos en Float, que arrastran
                // ruido binario (FIN-05): sin ella un 1e-13 traba una anulación legítima.
                const updated = await tx.student.updateMany({
                    where: {
                        id: fee.studentId,
                        ...(creditDelta < 0 ? { creditBalance: { gte: -creditDelta - 0.005 } } : {})
                    },
                    data: { creditBalance: { increment: creditDelta } }
                });

                if (updated.count === 0) {
                    const student = await tx.student.findUnique({
                        where: { id: fee.studentId },
                        select: { creditBalance: true }
                    });

                    if (!student) throw new Error("Alumno no encontrado");

                    throw new Error(
                        `No se puede anular: hay que devolver $${(-creditDelta).toLocaleString()} de saldo a favor ` +
                        `y el alumno sólo tiene $${student.creditBalance.toLocaleString()}. ` +
                        `Anulá primero los pagos hechos con ese saldo.`
                    );
                }
            }

            // Marcar el pago como anulado
            await tx.payment.update({
                where: { id: payment.id },
                data: { status: "VOIDED" }
            });

            // El contra-asiento tiene que espejar lo que se asentó, no lo que dice el pago:
            // una aplicación de saldo se asienta en 0 porque la plata ya había entrado como
            // adelanto. Con `-payment.amount` el libro mayor registraba una salida de caja
            // que nunca ocurrió.
            const originalEntries = await tx.transaction.findMany({
                where: { paymentId: payment.id, status: "VALID" },
                select: { amount: true }
            });
            const reversalAmount = originalEntries.reduce((total, t) => total + t.amount, 0);

            // Marcar transacción original como anulada
            await tx.transaction.updateMany({
                where: { paymentId: payment.id },
                data: { status: "VOIDED" }
            });

            // Contra-asiento
            const adjustmentDescription = reason
                ? `Anulación de Pago de Cuota #${payment.id.slice(-6)} - Motivo: ${reason}`
                : `Anulación de Pago de Cuota #${payment.id.slice(-6)}`;

            await tx.transaction.create({
                data: {
                    instituteId: user.instituteId as string,
                    amount: -reversalAmount,
                    // Un REFUND de $0 sería mentira: no hubo devolución de plata.
                    type: reversalAmount === 0 ? "ADJUSTMENT" : "REFUND",
                    method: payment.method,
                    date: new Date(),
                    description: adjustmentDescription,
                    paymentId: payment.id,
                    operatorId: user.id
                }
            });

            // Recalcular la cuota desde los pagos que siguen en pie, no restándole el pago
            // al snapshot: el snapshot está topeado en el importe de la cuota, así que si
            // hubo excedente le restaba de más y el alumno quedaba debiendo plata que ya
            // había pagado.
            const newPaidAmount = Math.min(capitalAfter, fee.originalAmount);

            // Mismo medio centavo de tolerancia que arriba, y por lo mismo (FIN-05): con
            // comparaciones exactas una cuota saldada queda `PARTIAL` por un 1e-13 y el
            // alumno figura como deudor de una fracción de centavo, sin forma de saldarla.
            let newStatus: any = "PARTIAL";
            if (newPaidAmount >= fee.originalAmount - 0.005) newStatus = "PAID";
            else if (newPaidAmount <= 0.005) newStatus = "PENDING";

            await tx.fee.update({
                where: { id: payment.feeId },
                data: {
                    paidAmount: newPaidAmount,
                    status: newStatus,
                    datePaid: newStatus === "PAID" ? fee.datePaid : null
                }
            });
        }, COLLECTION_TX_OPTIONS);

        revalidatePath("/payments");
        revalidatePath("/payments/debtors");
        revalidatePath("/students");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message || "Error al anular pago" };
    }
}

export async function voidIncomeAction(incomeId: string, reason?: string) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    try {
        await prisma.$transaction(async (tx) => {
            const income = await tx.miscellaneousIncome.findFirst({
                where: { id: incomeId, instituteId: user.instituteId as string }
            });

            if (!income) throw new Error("Ingreso no encontrado");
            if (income.status === "VOIDED") throw new Error("El ingreso ya fue anulado");

            // Marcar ingreso como anulado
            await tx.miscellaneousIncome.update({
                where: { id: income.id },
                data: { status: "VOIDED" }
            });

            // Marcar transacción original como anulada
            await tx.transaction.updateMany({
                where: { miscIncomeId: income.id },
                data: { status: "VOIDED" }
            });

            // Generar contra-asiento
            const adjustmentDescription = reason
                ? `Anulación de Ingreso #${income.id.slice(-6)} - Motivo: ${reason}`
                : `Anulación de Ingreso #${income.id.slice(-6)}`;
                
            await tx.transaction.create({
                data: {
                    instituteId: user.instituteId as string,
                    amount: -income.amount, // Negativo para compensar el ingreso original
                    type: "ADJUSTMENT",
                    method: income.method,
                    date: new Date(),
                    description: adjustmentDescription,
                    miscIncomeId: income.id,
                    operatorId: user.id
                }
            });
        });

        revalidatePath("/payments");
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message || "Error al anular el ingreso" };
    }
}

/**
 * Registra un adelanto de dinero (sin vincular a cuota) directamente al saldo del alumno.
 */
export async function registerAdvanceAction(formData: FormData) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    const studentId = formData.get("studentId") as string;
    const amountStr = formData.get("amount") as string;
    const method = formData.get("method") as string;
    const notes = formData.get("notes") as string;

    const amount = parseFloat(amountStr);

    if (!studentId || isNaN(amount) || amount <= 0) {
        return { success: false, error: "Datos del adelanto inválidos" };
    }

    try {
        // Acredita saldo a favor: sin el instituto, un admin podía cargarle
        // plata a un alumno de otro instituto mandando su ID.
        const student = await prisma.student.findFirst({
            where: { id: studentId, instituteId: user.instituteId },
            select: { name: true }
        });

        if (!student) return { success: false, error: "Alumno no encontrado" };

        await prisma.$transaction(async (tx) => {
            // 1. Crear el registro en MiscellaneousIncome para tener trazabilidad
            const income = await tx.miscellaneousIncome.create({
                data: {
                    description: notes || "Adelanto de Pago - Saldo a Favor",
                    amount,
                    category: "ADELANTO",
                    method: method || "EFECTIVO",
                    date: new Date(),
                    instituteId: user.instituteId as string,
                    studentId: studentId,
                    status: "VALID"
                }
            });

            // 2. Crear transacción en el libro mayor
            await tx.transaction.create({
                data: {
                    instituteId: user.instituteId as string,
                    amount: amount,
                    type: "MISC_INCOME",
                    method: income.method,
                    date: new Date(),
                    description: `Adelanto - ${student.name}`,
                    miscIncomeId: income.id,
                    operatorId: user.id
                }
            });

            // 3. Incrementar el crédito del alumno
            await tx.student.update({
                where: { id: studentId },
                data: { creditBalance: { increment: amount } }
            });
        });

        revalidatePath("/payments");
        revalidatePath("/students");
        return { success: true };
    } catch (e) {
        console.error(e);
        return { success: false, error: "Error al registrar el adelanto" };
    }
}

/**
 * Permite pagar una cuota usando el saldo a favor (creditBalance) del alumno.
 */
export async function applyCreditToFeeAction(feeId: string, creditAmount: number) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

    if (isNaN(creditAmount) || creditAmount <= 0) {
        return { success: false, error: "Monto de crédito inválido" };
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            await lockFee(tx, feeId);

            const fee = await tx.fee.findFirst({
                where: { id: feeId, instituteId: user.instituteId },
                include: { student: true }
            });

            if (!fee || !fee.student) return { success: false, error: "Cuota o alumno no encontrado" } as const;

            const remainingDebt = fee.originalAmount - fee.paidAmount;

            // Con la cuota bloqueada este valor ya es confiable, así que se puede
            // rechazar el caso sin sentido en vez de aplicar un importe negativo.
            if (remainingDebt <= 0) return { success: false, error: "La cuota no tiene deuda pendiente" } as const;

            const actualApplication = Math.min(creditAmount, remainingDebt);

            // 1. Descontar del saldo del alumno
            // El saldo se descuenta con la condición en el `where`: antes se leía, se
            // validaba y después se descontaba, así que dos aplicaciones simultáneas
            // pasaban las dos el control y el balance quedaba negativo. Se exige el
            // `creditAmount` pedido, no lo que se termina aplicando, que es lo que
            // validaba el chequeo original.
            const debited = await tx.student.updateMany({
                where: { id: fee.studentId, creditBalance: { gte: creditAmount } },
                data: { creditBalance: { decrement: actualApplication } }
            });

            if (debited.count === 0) return { success: false, error: "Saldo insuficiente" } as const;

            // 2. Crear registro de pago (virtualmente es un pago con método 'SALDO')
            const payment = await tx.payment.create({
                data: {
                    feeId,
                    amount: actualApplication,
                    method: "SALDO",
                    notes: "Pago con saldo a favor",
                    date: new Date()
                }
            });

            // 3. Crear transacción en libro mayor (es un ajuste de balance interno, suma 0 neto a la caja real)
            // Pero lo registramos como ADJUSTMENT para trazabilidad
            await tx.transaction.create({
                data: {
                    instituteId: user.instituteId as string,
                    amount: 0, // No entra dinero real a la caja hoy, ya entró antes
                    type: "ADJUSTMENT",
                    method: "SALDO",
                    date: new Date(),
                    description: `Aplicación de Saldo a Favor - Cuota ${fee.month}/${fee.year}`,
                    paymentId: payment.id,
                    operatorId: user.id
                }
            });

            // 4. Actualizar estado de la cuota
            // (el saldo del alumno ya se descontó arriba, junto con su control)
            const newTotalPaid = fee.paidAmount + actualApplication;
            const newStatus = newTotalPaid >= fee.originalAmount ? "PAID" : "PARTIAL";

            await tx.fee.update({
                where: { id: feeId },
                data: {
                    paidAmount: newTotalPaid,
                    status: newStatus,
                    datePaid: newStatus === "PAID" ? new Date() : fee.datePaid
                }
            });

            return { success: true } as const;
        }, COLLECTION_TX_OPTIONS);

        if (!result.success) return result;

        revalidatePath("/payments");
        revalidatePath("/payments/debtors");
        revalidatePath("/students");
        return { success: true };
    } catch (e: any) {
        console.error(e);
        return { success: false, error: "Error al aplicar el saldo a favor" };
    }
}

export async function getReceiptDataAction(paymentId: string) {
    const user = await getAuthAndInstitute();
    if (!user) return { success: false, error: "No autorizado" };

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
        if (payment.fee.instituteId !== user.instituteId) return { success: false, error: "Acceso denegado" };

        const institute = await prisma.institute.findUnique({
            where: { id: user.instituteId },
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
