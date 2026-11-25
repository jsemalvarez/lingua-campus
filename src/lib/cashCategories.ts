/**
 * Cómo se llaman en pantalla las categorías de los gastos y de los ingresos varios.
 * En la base va la clave. Lo que no está en el mapa se muestra tal cual está: es
 * preferible un `NOMINA` crudo en pantalla a esconder un movimiento que existe
 * (FEAT-31).
 */
const EXPENSE_LABELS: Record<string, string> = {
    Payroll: "Sueldos",
    ALQUILER: "Alquiler / Expensas",
    SERVICIOS: "Servicios",
    MANTENIMIENTO: "Mantenimiento / Limpieza",
    MATERIALES: "Material Didáctico",
    PUBLICIDAD: "Publicidad / Marketing",
    OTROS: "Otros"
};

const INCOME_LABELS: Record<string, string> = {
    VENTA_LIBROS: "Venta de Libros",
    EXCURSION: "Excursión / Salida",
    TALLER: "Taller / Seminario",
    DERECHO_EXAMEN: "Derecho de Examen",
    OTROS: "Otros Ingresos"
};

export const expenseLabel = (category: string) => EXPENSE_LABELS[category] ?? category;
export const incomeLabel = (category: string) => INCOME_LABELS[category] ?? category;
