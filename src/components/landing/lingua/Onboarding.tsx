import type { ReactNode } from "react";
import { ArrowRight, Check, Lock, Sheet, Siren } from "lucide-react";
import { LogoMark } from "./LogoMark";
import { Section, Sparkle, Tag, Underlined } from "./ui";

// «Empezar es simple»: el alta, la migración, el soporte y la permanencia, entre Precios y
// Preguntas frecuentes (lienzo del 01/10/2026). Cada tarjeta lleva un dibujo chico arriba.
// Los plazos los fijó el dueño: el alta tarda minutos, el soporte responde en menos de 48
// horas hábiles y las emergencias se atienden también fines de semana y feriados (no de
// madrugada: por eso no dice «24 horas»).

export function Onboarding() {
  return (
    <Section id="empezar" className="bg-white text-lc-ink">
      <div aria-hidden="true" className="absolute left-[calc(100%-140px)] top-[-80px] h-[240px] w-[240px] rounded-full bg-[rgba(255,197,61,0.16)] lg:left-[1150px] lg:top-[-120px] lg:h-[380px] lg:w-[380px]" />
      <Sparkle color="#ff6b4a" className="absolute left-[calc(100%-60px)] top-[84px] h-[30px] w-[30px] lg:left-[1250px] lg:top-[150px] lg:h-10 lg:w-10" />

      <div className="relative flex flex-col gap-7 pb-16 pt-[72px] lg:gap-[52px] lg:pb-[104px] lg:pt-[104px]">
        <header className="flex max-w-[760px] flex-col gap-4 lg:gap-[18px]">
          <Tag tone="sky">Sin vueltas</Tag>
          <h2 className="m-0 text-balance font-display text-[38px] font-extrabold leading-[1.03] tracking-[-0.035em] lg:text-[52px] lg:leading-[1.02]">
            Empezar es <Underlined>simple.</Underlined>
          </h2>
          <p className="m-0 max-w-[640px] text-pretty text-[16.5px] leading-[1.55] text-lc-text lg:text-[19px] lg:leading-[1.6]">
            Nos ocupamos de la parte pesada del cambio, para que tu equipo siga con las clases.
          </p>
        </header>

        <div className="flex flex-col gap-3 lg:gap-5">
          <div className="grid gap-3 md:grid-cols-2 lg:gap-5 xl:grid-cols-4">
            <Card tone="bg-lc-violet-soft" title="Tu campus, en minutos." art={<NewCampusArt />}>
              Damos de alta tu instituto en el momento, con su propia dirección para entrar. El dominio propio llega
              cuando lo aprueba nic.ar.
            </Card>
            <Card tone="bg-lc-yellow-soft" title="Migramos tus datos, sin costo." art={<MigrationArt />}>
              Pasamos tus alumnos, cursos y cuotas desde tus planillas. El tiempo depende de cuántos datos tengas.
            </Card>
            <Card tone="bg-lc-green-soft" title="Soporte real, en menos de 48 horas hábiles." art={<SupportArt />}>
              Tus consultas y los cambios que nos pidas no quedan en espera: te responde alguien del equipo.
            </Card>
            <Card tone="bg-lc-coral-soft" title="Sin permanencia." art={<MonthlyArt />}>
              Pagás mes a mes, sin contrato anual, y te das de baja cuando quieras.
            </Card>
          </div>

          <div className="flex flex-col gap-3 rounded-[24px] bg-lc-ink px-5 pb-[22px] pt-5 text-white lg:flex-row lg:items-center lg:gap-[18px] lg:px-7 lg:py-5">
            <span
              aria-hidden="true"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lc-coral-soft text-lc-coral-deep lg:h-[46px] lg:w-[46px]"
            >
              <Siren size={22} strokeWidth={2.2} />
            </span>
            <p className="m-0 flex flex-col gap-3 text-[15px] leading-[1.55] text-[#e6e1f5] lg:block lg:text-[16.5px] lg:leading-[1.5]">
              <strong className="font-display text-[19.5px] font-bold leading-[1.2] tracking-[-0.02em] text-white lg:mr-1.5 lg:text-[19px] lg:tracking-[-0.015em]">
                Emergencias, todos los días.
              </strong>
              <span>
                Cuando surge un imprevisto que no puede esperar, lo atendemos enseguida, los fines de semana y también
                los feriados.
              </span>
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}

function Card({ tone, title, art, children }: { tone: string; title: string; art: ReactNode; children: ReactNode }) {
  return (
    <article className={`flex flex-col gap-4 rounded-[24px] px-4 pb-[22px] pt-4 lg:gap-5 lg:rounded-[28px] lg:px-[22px] lg:pb-7 lg:pt-[22px] ${tone}`}>
      <div
        aria-hidden="true"
        className="flex h-[112px] flex-col justify-center rounded-[18px] bg-white px-3.5 py-3 lg:h-32 lg:rounded-[20px] xl:[zoom:0.85] min-[1440px]:[zoom:1]"
      >
        {art}
      </div>
      <div className="flex flex-col gap-1.5 px-1 lg:gap-2">
        <h3 className="m-0 font-display text-[19.5px] font-bold leading-[1.2] tracking-[-0.02em] lg:text-[21px]">{title}</h3>
        <p className="m-0 text-[15px] leading-[1.55] text-lc-body lg:text-[15.5px]">{children}</p>
      </div>
    </article>
  );
}

/* ─── Dibujos de las tarjetas ────────────────────────────────────────────── */

function NewCampusArt() {
  return (
    <div className="flex flex-col gap-2.5 lg:gap-3">
      <div className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap rounded-xl bg-[#f6f4ff] p-[9px] text-[12px] font-semibold text-lc-body lg:text-[11px]">
        <Lock size={13} strokeWidth={2.4} className="shrink-0 text-lc-violet-deep" />
        <span>tuinstituto.lingua-campus.com.ar</span>
      </div>
      <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-lc-green-soft py-1.5 pl-2 pr-3 text-[12.5px] font-bold text-lc-green-deep">
        <Check size={15} strokeWidth={2.8} />
        Instituto creado
      </span>
    </div>
  );
}

function SheetChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-[10px] border border-[#cdeedd] bg-[#f3faf6] px-2.5 py-[7px] text-[11.5px] font-bold text-lc-green-deep">
      <Sheet size={13} strokeWidth={2.2} />
      {children}
    </span>
  );
}

function MigrationArt() {
  return (
    <div className="flex items-center justify-center gap-3.5 lg:gap-3">
      <div className="flex flex-col gap-1.5">
        <SheetChip>alumnos.xlsx</SheetChip>
        <SheetChip>cuotas 2026</SheetChip>
      </div>
      <ArrowRight size={22} strokeWidth={2.4} className="shrink-0 text-lc-yellow-deep" />
      <span className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-[17px] bg-lc-cream shadow-[0_6px_14px_rgba(31,26,61,0.08)] lg:h-[58px] lg:w-[58px] lg:rounded-[18px]">
        <LogoMark size={38} />
      </span>
    </div>
  );
}

function SupportArt() {
  return (
    <div className="flex flex-col gap-2">
      <span className="max-w-[85%] self-start rounded-[14px_14px_14px_4px] bg-[#f1eef7] px-[11px] py-[7px] text-[12.5px] leading-[1.4]">
        ¿Cómo registro un pago parcial? <span className="text-[10.5px] text-lc-subtle">lun 22:10</span>
      </span>
      <span className="max-w-[85%] self-end rounded-[14px_14px_4px_14px] bg-lc-violet px-[11px] py-[7px] text-[12.5px] leading-[1.4] text-white">
        ¡Buen día! Te muestro, es así: <span className="text-[10.5px] text-[#d9d4ff]">mar 9:15</span>
      </span>
    </div>
  );
}

function MonthlyArt() {
  return (
    <div className="flex flex-col items-center gap-2.5 lg:gap-3">
      <div className="flex gap-2">
        {["Oct", "Nov"].map((month) => (
          <span
            key={month}
            className="inline-flex items-center gap-[5px] rounded-full bg-lc-coral-soft px-[11px] py-[7px] text-[12.5px] font-bold text-lc-coral-deep"
          >
            <Check size={13} strokeWidth={2.8} />
            {month}
          </span>
        ))}
        <span className="inline-flex items-center rounded-full border-[1.5px] border-dashed border-[#e9b8a3] px-3 py-1.5 text-[12.5px] font-bold text-lc-subtle">
          Dic
        </span>
      </div>
      <span className="text-[12.5px] font-bold text-lc-body">Mes a mes</span>
    </div>
  );
}
