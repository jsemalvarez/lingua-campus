import type { ReactNode } from "react";

// Sello amarillo de «Instituto fundador», con el texto girando alrededor.
// El texto se estira a la circunferencia exacta (`textLength`) para que el aire
// entre las dos frases sea el mismo de los dos lados; `spacing` queda de base.
// Al final van un espacio duro (el SVG descarta uno común) y un carácter de ancho
// cero: `textLength` reparte el aire entre letras y no después de la última, así
// que sin él la unión de la vuelta quedaba más apretada que el resto.
// `still` lo deja quieto: el de un lugar reservado no gira, el que invita sí.

const SIZES = {
  xl: { box: 420, radius: 150, font: 24, spacing: 8, inset: 22, border: 3, shadow: "0 40px 90px rgba(31,26,61,0.35)" },
  lg: { box: 280, radius: 100, font: 16, spacing: 5, inset: 15, border: 2.5, shadow: "0 30px 70px rgba(31,26,61,0.35)" },
  ml: { box: 220, radius: 79, font: 13.5, spacing: 3.9, inset: 12, border: 1.5, shadow: "0 16px 34px rgba(31,26,61,0.18)" },
  md: { box: 170, radius: 61, font: 10.5, spacing: 3, inset: 9, border: 1.5, shadow: "0 16px 34px rgba(31,26,61,0.18)" },
  sm: { box: 128, radius: 46, font: 8, spacing: 2.2, inset: 7, border: 1.5, shadow: "0 12px 26px rgba(31,26,61,0.18)" },
} as const;

export function Seal({
  size,
  id,
  className,
  still = false,
  children,
}: {
  size: keyof typeof SIZES;
  id: string;
  className?: string;
  still?: boolean;
  children: ReactNode;
}) {
  const s = SIZES[size];
  const c = s.box / 2;
  return (
    <div aria-hidden="true" className={`relative shrink-0 ${className ?? ""}`} style={{ width: s.box, height: s.box }}>
      <div className="absolute inset-0 rounded-full bg-lc-yellow" style={{ boxShadow: s.shadow }} />
      <div
        className="absolute rounded-full border-dashed border-[rgba(31,26,61,0.35)]"
        style={{ inset: s.inset, borderWidth: s.border }}
      />
      <svg viewBox={`0 0 ${s.box} ${s.box}`} width={s.box} height={s.box} className={`absolute inset-0 ${still ? "" : "lc-spin"}`}>
        <defs>
          <path
            id={id}
            d={`M${c},${c} m-${s.radius},0 a${s.radius},${s.radius} 0 1,1 ${s.radius * 2},0 a${s.radius},${s.radius} 0 1,1 -${s.radius * 2},0`}
          />
        </defs>
        <text
          className="font-display"
          style={{ fontSize: s.font, fontWeight: 800, letterSpacing: s.spacing, fill: "#1f1a3d" }}
        >
          <textPath href={`#${id}`} textLength={2 * Math.PI * s.radius} lengthAdjust="spacing">
            INSTITUTO FUNDADOR · LINGUA CAMPUS ·{" ​"}
          </textPath>
        </text>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-lc-ink">{children}</div>
    </div>
  );
}
