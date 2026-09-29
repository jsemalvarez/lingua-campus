import Image from "next/image";
import { LogoMark } from "./LogoMark";
import { Seal } from "./Seal";
import { MES_LOGO_URL, Section, Tag } from "./ui";

// El caso de Modern English School, fundador Nº 01. Patricia está de acuerdo con que se
// la muestre como cliente fundador. Los números salen de producción y llevan su fecha.

const STATS = [
  { value: "205", label: "alumnos cursando", className: "bg-lc-violet-soft", number: "text-lc-violet-deep" },
  { value: "30", label: "cursos activos", className: "bg-lc-yellow-soft", number: "text-lc-yellow-deep" },
  { value: "175", label: "tutores con cuenta", className: "bg-lc-green-soft", number: "text-lc-green-deep" },
];

const QUOTE =
  "La inteligencia artificial ya es parte del presente, y por eso nos alegra poder sumar herramientas que enriquecen las prácticas, acompañan el proceso de aprendizaje y brindan un valor agregado concreto a nuestros estudiantes.";

function CaseSeal({ size }: { size: "md" | "sm" }) {
  return (
    <Seal size={size} id={`lc-sello-mes-${size}`} className="rotate-[10deg]">
      <LogoMark size={size === "md" ? 40 : 30} variant="yellow" />
      <span
        className={`font-display font-extrabold leading-none tracking-[-0.03em] ${size === "md" ? "text-[25px]" : "text-[19px]"}`}
      >
        Nº 01
      </span>
    </Seal>
  );
}

export function CaseStudy() {
  return (
    <Section id="caso" className="bg-lc-cream text-lc-ink">
      <div aria-hidden="true" className="absolute left-[calc(100%-260px)] top-[-70px] h-[230px] w-[230px] rounded-full bg-[rgba(255,107,74,0.10)] lg:left-[1180px] lg:top-10 lg:h-[360px] lg:w-[360px]" />
      <div aria-hidden="true" className="absolute bottom-[-60px] left-[-130px] h-[280px] w-[280px] rounded-full bg-[rgba(75,62,240,0.08)] lg:h-[340px] lg:w-[340px]" />

      <div className="relative flex flex-col gap-6 pb-16 pt-[72px] lg:gap-[52px] lg:pb-24 lg:pt-[104px]">
        <div className="flex items-center justify-between gap-10">
          <header className="flex max-w-[900px] flex-col gap-4 lg:gap-[18px]">
            <Tag tone="coral">Caso real</Tag>
            <h2 className="m-0 text-balance font-display text-[38px] font-extrabold leading-[1.03] tracking-[-0.035em] lg:text-[52px]">
              Así lo usa{" "}
              <span className="lg:relative lg:whitespace-nowrap">
                Modern English{" "}
                <span className="relative whitespace-nowrap">
                  School.
                  <HandStroke className="-bottom-[0.24em] h-[0.34em] lg:hidden" />
                </span>
                <HandStroke className="hidden -bottom-[0.22em] h-[0.3em] lg:block" />
              </span>
            </h2>
            <p className="m-0 max-w-[720px] text-pretty text-[16.5px] leading-[1.55] text-lc-text lg:text-[19px] lg:leading-[1.6]">
              Un instituto de inglés de Mar del Plata, con más de 200 alumnos, y el primero en sumarse como fundador.
            </p>
          </header>
          <div className="hidden lg:mr-[94px] lg:block">
            <CaseSeal size="md" />
          </div>
        </div>

        <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] lg:gap-6">
          <div className="relative z-10 -mb-[46px] mr-1.5 self-end lg:hidden">
            <CaseSeal size="sm" />
          </div>

          <figure className="relative m-0 flex flex-col gap-6 rounded-[26px] bg-white px-[22px] pb-6 pt-[70px] shadow-[0_1px_2px_rgba(31,26,61,0.05),0_14px_32px_rgba(31,26,61,0.06)] lg:justify-between lg:gap-9 lg:rounded-[32px] lg:px-12 lg:pb-11 lg:pt-16 lg:shadow-[0_1px_2px_rgba(31,26,61,0.05),0_18px_40px_rgba(31,26,61,0.06)]">
            <span
              aria-hidden="true"
              className="absolute left-[18px] top-0.5 font-display text-[110px] font-extrabold leading-none text-lc-coral lg:left-9 lg:top-1 lg:text-[150px]"
            >
              “
            </span>
            <blockquote className="relative m-0 text-pretty font-display text-[21px] font-semibold leading-[1.4] tracking-[-0.01em] lg:text-[27px] lg:leading-[1.38] lg:tracking-[-0.015em]">
              {QUOTE}
            </blockquote>
            <figcaption className="flex items-center gap-3.5 lg:gap-4">
              <Image
                src={MES_LOGO_URL}
                alt="Logo de Modern English School"
                width={58}
                height={58}
                className="h-[52px] w-[52px] shrink-0 rounded-[14px] border-[1.5px] border-[#efe6d8] bg-white object-contain lg:h-[58px] lg:w-[58px] lg:rounded-2xl"
              />
              <div className="flex flex-col gap-[3px]">
                <span className="text-[16px] font-bold text-lc-ink lg:text-[17px]">Patricia Muñis</span>
                <span className="text-[14.5px] leading-[1.45] text-lc-text lg:text-[15px]">
                  Dueña y directora de{" "}
                  <a
                    href="https://www.modernenglishschool.com.ar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whitespace-nowrap font-bold text-lc-violet-deep hover:underline"
                  >
                    Modern English School
                  </a>
                </span>
              </div>
            </figcaption>
          </figure>

          <div className="mt-4 grid grid-cols-3 gap-2.5 lg:mt-0 lg:flex lg:flex-col lg:gap-4">
            {STATS.map((stat) => (
              <div
                key={stat.label}
                className={`flex flex-col gap-1 rounded-[20px] px-3 py-4 lg:grow lg:justify-center lg:rounded-[28px] lg:px-[30px] lg:py-[26px] ${stat.className}`}
              >
                <span
                  className={`font-display text-[36px] font-extrabold leading-none tracking-[-0.04em] lg:text-[58px] ${stat.number}`}
                >
                  {stat.value}
                </span>
                <span className="text-[13.5px] leading-[1.35] text-lc-body lg:text-[17px] lg:leading-[1.45]">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="m-0 -mt-2 text-[13px] leading-normal text-lc-subtle lg:-mt-7 lg:text-[13.5px]">
          Datos de Lingua Campus al 27 de septiembre de 2026.
        </p>
      </div>
    </Section>
  );
}

function HandStroke({ className }: { className: string }) {
  return (
    <svg
      viewBox="0 0 200 16"
      preserveAspectRatio="none"
      fill="none"
      aria-hidden="true"
      className={`pointer-events-none absolute -left-[2px] w-[calc(100%+4px)] ${className}`}
    >
      <path
        d="M3 11 C 55 3, 120 2, 197 8"
        stroke="#ff6b4a"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        className="[stroke-width:4] lg:[stroke-width:5]"
      />
    </svg>
  );
}
