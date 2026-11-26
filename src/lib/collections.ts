/**
 * Cómo se agrupan los cobros por forma de pago.
 *
 * En la base `method` es texto libre: cada formulario manda el suyo, y el de
 * adelantos mandó «EFECTIVE» hasta que se corrigió. Acá se lleva todo a cuatro
 * grupos, y es el único lugar que los decide: los usan la pantalla de Cobros y
 * los totales de Finanzas, que tienen que dar lo mismo.
 */
export type CollectionGroup = "efectivo" | "transferencia" | "otras" | "sin-registro";

export const COLLECTION_GROUPS: CollectionGroup[] = ["efectivo", "transferencia", "otras", "sin-registro"];

export const COLLECTION_GROUP_LABELS: Record<CollectionGroup, string> = {
    efectivo: "Efectivo",
    transferencia: "Transferencia",
    otras: "Otras formas",
    "sin-registro": "Sin forma de pago"
};

/** Los movimientos del libro mayor que son plata que entró. */
export const COLLECTION_TYPES = ["PAYMENT", "MISC_INCOME"] as const;

const METHOD_LABELS: Record<string, string> = {
    EFECTIVO: "Efectivo",
    EFECTIVE: "Efectivo",
    TRANSFERENCIA: "Transferencia",
    TARJETA: "Tarjeta",
    MERCADOPAGO: "Mercado Pago",
    OTRO: "Otra",
    OTROS: "Otra"
};

/**
 * El grupo de un cobro.
 *
 * **Sin operador, no hay forma de pago que valga.** Los cobros de la carga
 * inicial entraron por script desde la planilla del instituto, todos como
 * EFECTIVO y con una fecha por mes: ni lo uno ni lo otro lo eligió nadie. Son los
 * únicos sin operador —los que se cobran por pantalla lo llevan siempre—, así que
 * por ahí se los reconoce. En producción son 966, de febrero a junio de 2026 y
 * dos de agosto. Mostrarlos como efectivo sería inventar el dato.
 */
export function collectionGroup(movement: { method: string; operatorId: string | null }): CollectionGroup {
    if (!movement.operatorId) return "sin-registro";
    const label = METHOD_LABELS[movement.method];
    if (label === "Efectivo") return "efectivo";
    if (label === "Transferencia") return "transferencia";
    return "otras";
}

/** Cómo se lee la forma de pago de un cobro. Lo que no está en el mapa se muestra como está guardado. */
export function collectionMethodLabel(movement: { method: string; operatorId: string | null }): string {
    if (!movement.operatorId) return "Sin registro";
    return METHOD_LABELS[movement.method] ?? movement.method;
}

/** Cuánto entró por cada grupo. */
export function sumByGroup(movements: { method: string; operatorId: string | null; amount: number }[]): Record<CollectionGroup, number> {
    const totals: Record<CollectionGroup, number> = { efectivo: 0, transferencia: 0, otras: 0, "sin-registro": 0 };
    for (const movement of movements) totals[collectionGroup(movement)] += movement.amount;
    return totals;
}
