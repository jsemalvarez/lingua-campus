import { getReceiptDataAction } from "@/app/payments/receiptActions";
import { generatePaymentReceipt } from "@/lib/pdf/generateReceipt";

/**
 * Arma y descarga el recibo de un pago. Devuelve el error para mostrar, o `null`.
 *
 * Es el único lugar donde se decide qué dice un recibo. Antes esto estaba copiado
 * tal cual en la caja (`TransactionActions`) y en el botón de las otras tres
 * pantallas (`ReceiptDownloadButton`): arreglar uno dejaba la mitad de los recibos
 * mal según desde dónde se bajaran. Ver FIN-31.
 *
 * Los renglones suman el total, que es lo que entró a la caja: lo que este pago
 * le descontó a la cuota, el recargo, el descuento y, si sobró, lo que pasó al
 * saldo a favor. Debajo va el estado de la cuota después de este pago: su valor,
 * lo pagado antes y lo que queda, o que quedó saldada.
 */
export async function downloadPaymentReceipt(paymentId: string): Promise<string | null> {
    const result = await getReceiptDataAction(paymentId);
    if (!result.success || !result.payment || !result.fee || !result.institute) {
        return result.error || "Error al generar el recibo";
    }
    const { payment, fee, institute } = result;

    const concepts = [{ description: fee.label, amount: fee.appliedNow }];
    if (payment.surcharge > 0) concepts.push({ description: "Recargo / interés", amount: payment.surcharge });
    if (payment.discount > 0) concepts.push({ description: "Descuento aplicado", amount: -payment.discount });
    if (fee.surplus > 0) concepts.push({ description: "A saldo a favor del alumno", amount: fee.surplus });

    await generatePaymentReceipt({
        receiptNumber: payment.id.slice(0, 8).toUpperCase(),
        date: payment.date,
        studentName: payment.studentName,
        studentAddress: payment.studentAddress,
        concepts,
        total: payment.amount,
        feeStatus: { price: fee.price, paidBefore: fee.paidBefore, pending: fee.pendingAfter },
        institute: institute as any
    });
    return null;
}
