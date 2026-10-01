import type { ReactNode } from "react";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { LogoMark } from "./LogoMark";
import { FOUNDER_PER_STUDENT, money } from "./prices";
import { Seal } from "./Seal";
import { Section, Sparkle, Underlined } from "./ui";

// Programa de fundadores: cinco lugares, Modern English School es el Nº 01. El fundador
// paga el mismo precio por alumno en cualquier tramo, por los cuatro módulos y los que
// vengan (FOUNDER_PER_STUDENT en `prices.ts`, decidido el 29/09/2026), y lo pierde si
// se da de baja.

export function Founders() {
  return (
    <Section id="fundadores" className="bg-lc-violet text-white">
      <div aria-hidden="true" className="absolute left-[150px] top-[420px] h-[420px] w-[420px] rounded-full bg-white/[0.06] lg:left-[820px] lg:top-[-160px] lg:h-[760px] lg:w-[760px]" />
      <div aria-hidden="true" className="absolute bottom-[-120px] left-[-140px] h-[300px] w-[300px] rounded-full bg-[rgba(255,107,74,0.22)] lg:bottom-[-180px] lg:left-[-120px] lg:h-[380px] lg:w-[380px]" />
      <div aria-hidden="true" className="absolute bottom-[40px] right-[30px] hidden h-[110px] w-[180px] bg-[radial-gradient(#ffffff_1.6px,transparent_1.8px)] bg-[length:16px_16px] opacity-[0.22] lg:block" />

      <div className="relative flex flex-col gap-8 pb-16 pt-[72px] lg:flex-row lg:items-center lg:gap-12 lg:py-[104px] xl:gap-20">
        <div className="flex flex-col gap-8 lg:min-w-0 lg:flex-1 lg:gap-[34px] xl:w-[680px] xl:flex-none">
          <header className="flex flex-col gap-4 lg:gap-[18px]">
            <span className="self-start rounded-full bg-lc-yellow-soft px-[13px] py-[7px] text-[13.5px] font-bold text-lc-yellow-deep lg:px-[15px] lg:py-2 lg:text-[14.5px]">
              Clientes fundadores
            </span>
            <h2 className="m-0 text-balance font-display text-[38px] font-extrabold leading-[1.03] tracking-[-0.035em] text-white lg:text-[58px] lg:leading-[1.02]">
              Sumate a los institutos <Underlined color="#ffc53d">fundadores.</Underlined>
            </h2>
            <p className="m-0 max-w-[620px] text-pretty text-[16.5px] leading-[1.55] text-[#e4e0ff] lg:text-[19px] lg:leading-[1.6]">
              Los primeros 5 institutos en sumarse serán nuestros clientes fundadores.
            </p>
          </header>

          <FoundersSealMobile />

          <div className="flex flex-col gap-3">
            <Benefit number="1" title="Los cuatro módulos, a precio de fundador">
              {money(FOUNDER_PER_STUDENT)} por alumno que cursa, por mes.
            </Benefit>
            <Benefit number="2" title="Beneficio fundador sin limite de tiempo">
              El precio de fundador es valido mientras no te des de baja.
            </Benefit>
            <Benefit number="3" title="Los módulos que vengan, incluidos">
              El próximo: capacitación en IA para institutos de idiomas.
            </Benefit>
          </div>

          <div className="flex gap-3 text-[15px] leading-normal text-[#e4e0ff] lg:items-center lg:text-[15.5px]">
            <ShieldCheck size={20} strokeWidth={2.2} className="mt-0.5 shrink-0 text-lc-yellow lg:mt-0" aria-hidden="true" />
            <span>
              Y como a todos los institutos: <strong className="font-bold text-white">migramos tus datos sin costo</strong>{" "}
              y tenés <strong className="font-bold text-white">soporte técnico desde el primer día</strong>.
            </span>
          </div>

          <div className="flex flex-col items-center gap-4 lg:flex-row lg:flex-wrap lg:gap-x-[26px] lg:gap-y-3">
            <a
              href="#contacto"
              className="flex h-14 items-center justify-center gap-2.5 self-stretch whitespace-nowrap rounded-full bg-white text-[17px] font-extrabold text-lc-violet-deep shadow-[0_14px_30px_rgba(31,26,61,0.25)] transition-colors hover:bg-lc-yellow-soft lg:h-auto lg:self-auto lg:px-[30px] lg:py-[17px] lg:text-[17.5px]"
            >
              Quiero ser fundador <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
            </a>
            <span className="whitespace-nowrap text-[15.5px] font-bold text-white lg:text-[16px]">
              Quedan{" "}
              <span className="rounded-full bg-lc-yellow px-2.5 py-[3px] text-lc-ink lg:px-[11px]">4 de 5</span>{" "}
              lugares
            </span>
          </div>
        </div>

        <FoundersSealDesktop />
      </div>
    </Section>
  );
}

function Benefit({ number, title, children }: { number: string; title: string; children: ReactNode }) {
  return (
    <div className="flex gap-3.5 rounded-[22px] bg-white/10 p-[17px] lg:items-center lg:gap-4 lg:px-5">
      <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-lc-yellow font-display text-[17px] font-extrabold text-lc-ink lg:h-10 lg:w-10 lg:text-[18px]">
        {number}
      </span>
      <div className="flex flex-col gap-1 lg:gap-[3px]">
        <span className="font-display text-[18.5px] font-bold leading-[1.2] tracking-[-0.015em] text-white lg:text-[20px]">
          {title}
        </span>
        <span className="text-[15px] leading-normal text-[#d9d4ff] lg:text-[15.5px]">{children}</span>
      </div>
    </div>
  );
}

function SealNumber({ size }: { size: "xl" | "lg" }) {
  const big = size === "xl";
  return (
    <Seal size={size} id={`lc-sello-fundador-${size}`}>
      <LogoMark size={big ? 54 : 36} variant="yellow" className={big ? "mb-1" : "mb-0.5"} />
      <span className={`font-extrabold uppercase tracking-[0.18em] ${big ? "text-[15px]" : "text-[12px]"}`}>Nº</span>
      <span
        className={`font-display font-extrabold leading-[0.9] tracking-[-0.05em] ${big ? "text-[100px]" : "text-[68px]"}`}
      >
        02
      </span>
      <span className={`font-bold ${big ? "text-[14px]" : "text-[12px]"}`}>puede ser el tuyo</span>
    </Seal>
  );
}

function FoundersSealMobile() {
  return (
    <div aria-hidden="true" className="relative flex h-[330px] items-center justify-center lg:hidden">
      <div className="rotate-[-8deg]">
        <SealNumber size="lg" />
      </div>
      <Sparkle color="#ff6b4a" className="absolute left-3.5 top-5 h-[38px] w-[38px]" />
    </div>
  );
}

function FoundersSealDesktop() {
  return (
    <div
      aria-hidden="true"
      className="relative hidden h-[620px] w-[520px] shrink-0 items-center justify-center lg:flex lg:[zoom:0.7] xl:[zoom:0.85] min-[1440px]:[zoom:1]"
    >
      <div className="rotate-[-8deg]">
        <SealNumber size="xl" />
      </div>
      <Sparkle color="#ff6b4a" className="absolute left-10 top-[60px] h-[54px] w-[54px]" />
      <Sparkle color="#ffffff" className="absolute left-[470px] top-[480px] h-[30px] w-[30px]" />
    </div>
  );
}
