import { FOUNDER_SPOTS, FREE_SPOTS, RESERVED_SPOT, spotNumber, type SpotStatus } from "./founderSpots";
import { LogoMark } from "./LogoMark";
import { Seal } from "./Seal";
import { Tag, Underlined } from "./ui";

// El lugar de fundador reservado, debajo del caso de Modern English School (lienzo del
// 30/09/2026). Del instituto no se dice nada más que lo que está a la vista: no hay
// nombre, ciudad ni números para mostrar. Si no hay lugar reservado, no se muestra.

const SPOT_STYLES: Record<SpotStatus, { label: string; circle: string; text: string }> = {
  taken: { label: "Ocupado", circle: "bg-lc-yellow text-lc-ink", text: "font-bold text-lc-body" },
  reserved: {
    label: "Reservado",
    circle: "border-2 border-lc-coral-deep bg-lc-coral-soft text-lc-coral-deep",
    text: "font-bold text-lc-coral-deep",
  },
  free: { label: "Libre", circle: "border-2 border-dashed border-[#cfc6b8] text-lc-subtle", text: "text-lc-subtle" },
};

export function ReservedSpot() {
  if (RESERVED_SPOT === 0) return null;
  const number = spotNumber(RESERVED_SPOT);

  return (
    <div className="mt-4 flex flex-col lg:mt-3">
      <div className="relative z-10 -mb-[50px] mr-1.5 self-end lg:hidden">
        <ReservedSeal size="sm" number={number} />
      </div>

      <article className="relative flex flex-col gap-4 rounded-[26px] bg-white px-[22px] pb-[26px] pt-[70px] shadow-[0_1px_2px_rgba(31,26,61,0.05),0_14px_32px_rgba(31,26,61,0.06)] lg:flex-row lg:items-center lg:gap-10 lg:rounded-[32px] lg:px-14 lg:py-12 lg:shadow-[0_1px_2px_rgba(31,26,61,0.05),0_18px_40px_rgba(31,26,61,0.06)] xl:gap-14">
        <div className="hidden lg:block">
          <ReservedSeal size="ml" number={number} />
        </div>

        <div className="flex min-w-0 grow flex-col gap-4 xl:flex-row xl:items-center xl:gap-14">
          <div className="flex min-w-0 grow flex-col gap-4">
            <Tag tone="coral">Fundador Nº {number}</Tag>
            <h3 className="m-0 font-display text-[32px] font-extrabold leading-[1.05] tracking-[-0.035em] lg:text-[44px]">
              Lugar <Underlined>reservado.</Underlined>
            </h3>
            <p className="m-0 mt-1 max-w-[460px] text-pretty text-[16px] leading-[1.55] text-lc-text lg:mt-1.5 lg:text-[18px] lg:leading-[1.6]">
              Un nuevo instituto está probando Lingua Campus.
            </p>
          </div>

          <Spots />
        </div>
      </article>
    </div>
  );
}

function Spots() {
  return (
    <div className="mt-1.5 flex flex-col gap-3.5 border-t-[1.5px] border-[#f1eadf] pt-5 lg:gap-[18px] xl:mt-0 xl:w-[330px] xl:shrink-0 xl:self-stretch xl:justify-center xl:border-l-[1.5px] xl:border-t-0 xl:pl-12 xl:pt-0">
      <span
        id="lc-lugares-fundador"
        className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-lc-subtle lg:text-[13px]"
      >
        Lugares de fundador
      </span>
      <ol
        aria-labelledby="lc-lugares-fundador"
        className="m-0 flex list-none justify-between p-0 lg:justify-start lg:gap-2.5"
      >
        {FOUNDER_SPOTS.map((status, i) => {
          const style = SPOT_STYLES[status];
          return (
            <li key={i} className="flex w-[52px] flex-col items-center gap-[7px] lg:w-[54px] lg:gap-2">
              <span
                className={`box-border flex h-[46px] w-[46px] items-center justify-center rounded-full font-display text-[15px] font-extrabold lg:h-[54px] lg:w-[54px] lg:text-[17px] ${style.circle}`}
              >
                {spotNumber(i + 1)}
              </span>
              <span className={`text-[11.5px] lg:text-[12px] ${style.text}`}>{style.label}</span>
            </li>
          );
        })}
      </ol>
      <span className="mt-1 text-[15px] font-bold text-lc-ink lg:mt-0 lg:text-[15.5px]">
        Quedan{" "}
        <span className="rounded-full bg-lc-yellow px-2.5 py-[3px]">
          {FREE_SPOTS} de {FOUNDER_SPOTS.length}
        </span>{" "}
        lugares
      </span>
    </div>
  );
}

function ReservedSeal({ size, number }: { size: "ml" | "sm"; number: string }) {
  const big = size === "ml";
  return (
    <div className="relative">
      <Seal size={size} id={`lc-sello-reservado-${size}`} className="-rotate-6" still>
        <LogoMark size={big ? 50 : 30} variant="yellow" />
        <span
          className={`font-display font-extrabold leading-none tracking-[-0.03em] ${big ? "text-[32px]" : "text-[19px]"}`}
        >
          Nº {number}
        </span>
      </Seal>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <Stamp id={`lc-tinta-${size}`} width={big ? 218 : 128} className={big ? "translate-y-3" : "translate-y-2"} />
      </div>
    </div>
  );
}

/** El sello de goma «RESERVADO», con la tinta despareja de un sello de verdad. */
function Stamp({ id, width, className }: { id: string; width: number; className: string }) {
  return (
    <svg
      viewBox="0 0 220 60"
      width={width}
      height={(width * 60) / 220}
      aria-hidden="true"
      className={`-rotate-[16deg] opacity-95 mix-blend-multiply ${className}`}
    >
      <defs>
        <filter id={id} x="-5%" y="-10%" width="110%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={7} result="noise" />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -2.4 2.1"
            result="speckle"
          />
          <feComposite in="SourceGraphic" in2="speckle" operator="in" />
        </filter>
      </defs>
      <g filter={`url(#${id})`} fill="none" stroke="#c2410c">
        <rect x="1.75" y="1.75" width="216.5" height="56.5" rx="12" strokeWidth="3.5" />
        <rect x="7.5" y="7.5" width="205" height="45" rx="7" strokeWidth="1.5" />
        <text
          x="110"
          y="39.5"
          textAnchor="middle"
          textLength="172"
          lengthAdjust="spacing"
          fill="#c2410c"
          stroke="none"
          className="font-display"
          style={{ fontSize: 27, fontWeight: 800 }}
        >
          RESERVADO
        </text>
      </g>
    </svg>
  );
}
