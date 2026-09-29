// Logo de Lingua Campus: dos globos de diálogo con las iniciales (opción A3, 27/09/2026).
// El corte entre los globos se pinta con el color del fondo, así que cada fondo tiene
// su variante.

type Variant = "cream" | "ink" | "violet" | "yellow";

const COLORS: Record<Variant, { bubble: string; gap: string; l: string; c: string }> = {
  cream: { bubble: "#4b3ef0", gap: "#fff6ea", l: "#ffffff", c: "#1f1a3d" },
  ink: { bubble: "#8b82ff", gap: "#1f1a3d", l: "#1f1a3d", c: "#1f1a3d" },
  violet: { bubble: "#ffffff", gap: "#4b3ef0", l: "#4b3ef0", c: "#1f1a3d" },
  yellow: { bubble: "#4b3ef0", gap: "#ffc53d", l: "#ffffff", c: "#1f1a3d" },
};

const BUBBLE_L = "M26.42 66.31A28 28 0 1 0 9.69 49.58L6 76Z";
const BUBBLE_C = "M76.21 84.55A24 24 0 1 1 90.55 70.21L94 93Z";

export function LogoMark({
  size = 40,
  variant = "cream",
  className,
}: {
  size?: number;
  variant?: Variant;
  className?: string;
}) {
  const color = COLORS[variant];
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className={className}>
      <path d={BUBBLE_L} fill={color.bubble} stroke={color.bubble} strokeWidth={4} strokeLinejoin="round" />
      <path d={BUBBLE_C} fill={color.gap} stroke={color.gap} strokeWidth={12} strokeLinejoin="round" />
      <path d={BUBBLE_C} fill="#ff6b4a" stroke="#ff6b4a" strokeWidth={4} strokeLinejoin="round" />
      <text x="32" y="49.5" textAnchor="middle" fontSize="30" fontWeight="800" fill={color.l} className="font-display">
        L
      </text>
      <text x="68" y="71.8" textAnchor="middle" fontSize="28" fontWeight="800" fill={color.c} className="font-display">
        C
      </text>
    </svg>
  );
}
