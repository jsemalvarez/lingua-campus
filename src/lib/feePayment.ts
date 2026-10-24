/**
 * Cómo queda una cuota después de un cobro.
 *
 * Es la cuenta del servidor (`createPaymentAction`) y la de la pantalla de cobro,
 * que antes eran dos y no coincidían: la pantalla calculaba el excedente sobre el
 * efectivo y el servidor sobre lo que se descuenta de la cuota. En el cobro real
 * del 10/08 la pantalla anunció $40.000 y se acreditaron $43.000. Ver FIN-32.
 *
 * `amount` es lo que entra a la caja. A la cuota se le descuenta eso más el
 * descuento y menos el recargo, que es interés y no cancela deuda. Lo que pasa del
 * importe de la cuota va al saldo a favor del alumno.
 */
export function feeAfterPayment(
    fee: { originalAmount: number; paidAmount: number },
    payment: { amount: number; discount: number; surcharge: number },
) {
    const capital = payment.amount + payment.discount - payment.surcharge;
    const totalPaid = fee.paidAmount + capital;
    const paidAmount = Math.min(totalPaid, fee.originalAmount);
    return {
        /** Lo que el cobro le descuenta a la cuota. */
        capital,
        paidAmount,
        remaining: fee.originalAmount - paidAmount,
        surplus: Math.max(0, totalPaid - fee.originalAmount),
        settled: paidAmount >= fee.originalAmount,
    };
}

// Medio centavo, por los montos en Float (FIN-05).
const TOLERANCE = 0.005;

/**
 * Por qué un cobro no se puede grabar, o `null` si se puede. La pantalla lo
 * muestra antes de confirmar y el servidor lo hace cumplir.
 */
export function paymentProblem(
    fee: { originalAmount: number; paidAmount: number },
    payment: { amount: number; discount: number; surcharge: number },
): string | null {
    const after = feeAfterPayment(fee, payment);
    // Le restaría a la cuota lo que ya se había pagado.
    if (after.capital <= 0) return "El recargo no puede ser mayor que lo que se cobra.";
    // El saldo a favor es plata que entró y sobró: un descuento no puede generarlo.
    if (after.surplus - payment.amount > TOLERANCE) {
        return "El descuento no puede ser mayor que lo que falta pagar de la cuota.";
    }
    // El único cobro de $0 es el descuento del 100%: salda la cuota entera, o no
    // es un cobro.
    if (payment.amount === 0 && !after.settled) {
        return "Un cobro de $0 tiene que saldar la cuota: el descuento tiene que cubrir todo lo que falta.";
    }
    return null;
}
