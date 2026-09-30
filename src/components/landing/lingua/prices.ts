// Precios de la landing (decididos el 29/09/2026). Se contrata desde dos módulos y se
// paga por alumno que cursa, por mes, con un precio por alumno que depende del tramo.
// Tres módulos es el precio de dos más uno. Cada tramo tiene un tope: lo que se pagaría
// con el primer alumno del tramo siguiente, para que la factura nunca baje al cruzarlo.
// El fundador paga lo mismo en cualquier tramo, por los cuatro módulos.

export const MIN_MODULES = 2;
export const FOUNDER_PER_STUDENT = 1200;

export const TIERS = [
  { upTo: 50, label: "Hasta 50", perModule: 900, two: 1600, four: 3000 },
  { upTo: 150, label: "51 a 150", perModule: 800, two: 1400, four: 2600 },
  { upTo: 300, label: "151 a 300", perModule: 700, two: 1200, four: 2200 },
  { upTo: 500, label: "301 a 500", perModule: 600, two: 1000, four: 1800 },
] as const;

// Desde acá, presupuesto a medida.
export const MAX_STUDENTS = TIERS[TIERS.length - 1].upTo;

type Tier = (typeof TIERS)[number];

export function perStudent(tier: Tier, modules: number): number {
  if (modules === 2) return tier.two;
  if (modules === 3) return tier.two + tier.perModule;
  if (modules === 4) return tier.four;
  return 0;
}

export function monthlyPrice(students: number, modules: number) {
  const index = Math.max(
    TIERS.findIndex((tier) => students <= tier.upTo),
    0,
  );
  const price = perStudent(TIERS[index], modules);
  const subtotal = price * students;
  const next = TIERS[index + 1];
  const cap = next ? (TIERS[index].upTo + 1) * perStudent(next, modules) : null;
  const capped = cap !== null && subtotal > cap;
  return { perStudent: price, subtotal, cap: capped ? cap : null, total: capped ? cap : subtotal };
}

// Espacio duro después del «$», para que no quede solo al final de un renglón.
export const money = (value: number) => `$ ${value.toLocaleString("es-AR")}`;
