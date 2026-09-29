import type { ReactNode } from "react";

// Piezas que se repiten en todas las secciones de la landing.

type Tone = "violet" | "yellow" | "green" | "coral" | "sky";

const TONES: Record<Tone, string> = {
  violet: "bg-lc-violet-soft text-lc-violet-deep",
  yellow: "bg-lc-yellow-soft text-lc-yellow-deep",
  green: "bg-lc-green-soft text-lc-green-deep",
  coral: "bg-lc-coral-soft text-lc-coral-deep",
  sky: "bg-lc-sky-soft text-lc-sky-deep",
};

/** La etiqueta de arriba de cada sección. */
export function Tag({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={`self-start rounded-full px-[13px] py-[7px] text-[13.5px] font-bold lg:px-[15px] lg:py-2 lg:text-[14.5px] ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/** El subrayado a mano que llevan los títulos. Escala con el tamaño de la letra. */
export function Underlined({ children, color = "#ff6b4a" }: { children: ReactNode; color?: string }) {
  return (
    <span className="relative whitespace-nowrap">
      {children}
      <svg
        viewBox="0 0 200 16"
        preserveAspectRatio="none"
        fill="none"
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[0.24em] -left-[2px] h-[0.32em] w-[calc(100%+4px)]"
      >
        <path
          d="M3 11 C 55 3, 120 2, 197 8"
          stroke={color}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          className="[stroke-width:4] lg:[stroke-width:5]"
        />
      </svg>
    </span>
  );
}

/** Estrella de cuatro puntas, de adorno. */
export function Sparkle({ className, color = "#ffc53d" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill={color} aria-hidden="true" className={className}>
      <path d="M12 1.5 14.6 9.4 23 12 14.6 14.6 12 22.5 9.4 14.6 1 12 9.4 9.4Z" />
    </svg>
  );
}

/** Ícono dentro de un círculo de color, al lado de cada punto de una sección. */
export function IconDot({ tone, size = "md", children }: { tone: Tone; size?: "sm" | "md"; children: ReactNode }) {
  const box = size === "sm" ? "h-[38px] w-[38px] lg:h-10 lg:w-10" : "h-[42px] w-[42px] lg:h-11 lg:w-11";
  return (
    <span className={`flex shrink-0 items-center justify-center rounded-full ${box} ${TONES[tone]}`}>{children}</span>
  );
}

/** Sección con su ancla y el ancho de la página. */
export function Section({
  id,
  className,
  children,
}: {
  id?: string;
  className: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={`lc-clip relative ${className}`}>
      <div className="relative mx-auto w-full max-w-[1440px] px-5 lg:px-20">{children}</div>
    </section>
  );
}

export const WHATSAPP_NUMBER = "5492234218873";
export const WHATSAPP_DISPLAY = "+54 9 223 4218873";
export const CONTACT_EMAIL = "somoslinguacampus@gmail.com";
export const INSTAGRAM_URL = "https://www.instagram.com/somoslinguacampus/";
export const MES_LOGO_URL =
  "https://res.cloudinary.com/dwhdla1b4/image/upload/v1784242745/lingua-campus/logo_mes_mjsnim.webp";
