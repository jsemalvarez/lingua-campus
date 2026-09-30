import type { ReactNode } from "react";
import { ArrowRight, Globe, GraduationCap, Layers, Smartphone, Sparkles, Wallet } from "lucide-react";
import { PricingCalculator } from "./PricingCalculator";
import { TIERS, money, perStudent } from "./prices";
import { Section, Underlined } from "./ui";

// Precios: desde dos módulos, por alumno que cursa, con un precio por alumno según el
// tramo. Sin cuota base: la base del campus va con cualquier plan. Reglas en `prices.ts`.

export function Pricing() {
  return (
    <Section id="precios" className="bg-lc-ink text-white">
      <div aria-hidden="true" className="absolute left-[-170px] top-[520px] h-[340px] w-[340px] rounded-full bg-[rgba(75,62,240,0.28)] lg:left-[-160px] lg:top-[100px] lg:h-[460px] lg:w-[460px]" />
      <div aria-hidden="true" className="absolute right-[-100px] top-[-90px] h-[280px] w-[280px] rounded-full bg-[rgba(255,107,74,0.14)] lg:left-[1180px] lg:right-auto lg:top-[30px] lg:h-[360px] lg:w-[360px]" />

      <div className="relative flex flex-col gap-[18px] pb-16 pt-[72px] lg:gap-[22px] lg:pb-24 lg:pt-28">
        <header className="mb-2 flex flex-col gap-4 lg:mb-[22px] lg:items-center lg:gap-[18px] lg:text-center">
          <span className="self-start rounded-full bg-lc-coral-soft px-[13px] py-[7px] text-[13.5px] font-bold text-lc-coral-deep lg:self-center lg:px-[15px] lg:py-2 lg:text-[14.5px]">
            Precios
          </span>
          <h2 className="m-0 max-w-[980px] text-balance font-display text-[38px] font-extrabold leading-[1.03] tracking-[-0.035em] lg:text-[54px]">
            Elegí tus módulos y pagá por alumno que <Underlined>cursa.</Underlined>
          </h2>
          <p className="m-0 max-w-[740px] text-pretty text-[16.5px] leading-[1.55] text-lc-lavender lg:text-[19px] lg:leading-[1.6]">
            Desde dos módulos, con un precio por alumno inscripto en un curso activo, por mes, según cuántos alumnos
            cursan.
          </p>
        </header>

        <div className="flex flex-col gap-3 rounded-[24px] bg-white/[0.07] p-5 lg:flex-row lg:items-center lg:gap-[22px] lg:rounded-[26px] lg:px-7 lg:py-[22px]">
          <div className="flex items-center gap-3.5 lg:contents">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lc-violet-soft text-lc-violet-deep lg:h-[50px] lg:w-[50px]">
              <Layers size={22} strokeWidth={2.2} aria-hidden="true" />
            </span>
            <span className="font-display text-[20px] font-bold tracking-[-0.015em] lg:hidden">Base del campus</span>
          </div>
          <div className="flex flex-col gap-1 lg:grow">
            <span className="hidden font-display text-[22px] font-bold tracking-[-0.015em] lg:block">Base del campus</span>
            <span className="text-[15px] leading-normal text-lc-lavender lg:text-[15.5px]">
              Alumnos, cursos, aulas y horarios, el acceso de alumnos, familias y docentes, y todo el historial. Es lo que
              necesita cualquier módulo.
            </span>
          </div>
          <div className="flex flex-col items-start gap-2 border-t-[1.5px] border-dashed border-white/[0.18] pt-3.5 lg:shrink-0 lg:items-end lg:gap-1.5 lg:border-t-0 lg:pt-0">
            <span className="rounded-full bg-lc-yellow-soft px-[11px] py-1 text-[12.5px] font-extrabold text-lc-yellow-deep">
              Incluida en todos los planes
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-4 xl:grid-cols-4">
          <ModuleCard
            name="Módulo pedagógico"
            icon={<GraduationCap size={22} strokeWidth={2.2} />}
            tone="bg-lc-coral-soft text-lc-coral-deep"
            badge="Con práctica con IA"
          >
            <span>Clases, temas y contenidos</span>
            <span>Asistencia y notas</span>
            <span>Informes con firma</span>
            <span className="font-bold text-lc-coral-deep">Práctica con IA de cada clase</span>
            <span className="text-lc-subtle">
              <span className="rounded-full bg-lc-violet-soft px-[7px] py-0.5 text-[11px] font-extrabold text-lc-violet-deep">
                Próximamente
              </span>{" "}
              Generador de actividades: Kahoot, canciones, películas
            </span>
          </ModuleCard>
          <ModuleCard name="Módulo de gestión" icon={<Wallet size={22} strokeWidth={2.2} />} tone="bg-lc-green-soft text-lc-green-deep">
            <span>Cuotas, matrículas y exámenes</span>
            <span>Pagos, recibos y morosos</span>
            <span>Gastos y sueldos</span>
            <span>Caja y rentabilidad del mes</span>
          </ModuleCard>
          <ModuleCard name="Módulo de marca" icon={<Globe size={22} strokeWidth={2.2} />} tone="bg-lc-sky-soft text-lc-sky-deep">
            <span>Tu web, con tus cursos</span>
            <span>Tu logo y tu dominio</span>
            <span>Pre-inscripción online</span>
            <span>Botón de WhatsApp</span>
          </ModuleCard>
          <ModuleCard name="Módulo app" icon={<Smartphone size={22} strokeWidth={2.2} />} tone="bg-lc-yellow-soft text-lc-yellow-deep">
            <span>En el celular de alumnos, familias y docentes</span>
            <span>Se instala desde el navegador</span>
            <span>Con tu nombre y tu ícono, en tu dominio</span>
          </ModuleCard>
        </div>

        <PriceTable />

        <PricingCalculator />

        <div className="flex flex-col gap-4 rounded-[24px] bg-white/[0.06] p-5 lg:flex-row lg:items-center lg:gap-[18px] lg:px-[26px] lg:py-5">
          <div className="flex items-start gap-3.5 lg:grow lg:items-center lg:gap-[18px]">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lc-yellow text-lc-ink lg:h-[46px] lg:w-[46px]">
              <Sparkles size={21} strokeWidth={2.2} aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-1.5 lg:gap-1">
              <div className="flex flex-wrap items-center gap-2 lg:gap-2.5">
                <span className="text-[12px] font-extrabold uppercase tracking-[0.1em] text-lc-yellow lg:text-[12.5px]">
                  Próximo módulo
                </span>
                <span className="rounded-full border-[1.5px] border-white/35 px-[9px] py-0.5 text-[11.5px] font-bold text-[#e6e1f5] lg:text-[12px]">
                  En desarrollo
                </span>
              </div>
              <span className="font-display text-[20px] font-bold leading-[1.2] tracking-[-0.015em] lg:text-[21px]">
                Capacitación en IA para institutos de idiomas
              </span>
            </div>
          </div>
          <a
            href="#contacto"
            className="flex h-[54px] items-center justify-center gap-2.5 whitespace-nowrap rounded-full bg-white text-[16.5px] font-extrabold text-lc-violet-deep transition-colors hover:bg-lc-yellow-soft lg:h-auto lg:px-6 lg:py-[15px]"
          >
            Pedí una demo <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />
          </a>
        </div>

        <p className="m-0 mt-1 text-center text-[13px] leading-normal text-lc-mist lg:text-[13.5px]">
          Precios en pesos argentinos, por mes. Se cuenta cada alumno inscripto en un curso activo. Cerca del final de
          un tramo, nunca se paga más que con el primer alumno del tramo siguiente. [Final o + IVA: A DEFINIR]
        </p>
      </div>
    </Section>
  );
}

function ModuleCard({
  name,
  icon,
  tone,
  badge,
  children,
}: {
  name: string;
  icon: ReactNode;
  tone: string;
  badge?: string;
  children: ReactNode;
}) {
  const iconDot = (
    <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full lg:h-[46px] lg:w-[46px] ${tone}`}>
      {icon}
    </span>
  );
  const badgeEl = badge && (
    <span className="self-start rounded-full bg-lc-coral px-2.5 py-1 text-[11.5px] font-extrabold text-lc-ink lg:py-[5px]">
      {badge}
    </span>
  );
  return (
    <div className="flex flex-col gap-3.5 rounded-[24px] bg-white p-5 text-lc-ink lg:rounded-[28px] lg:px-[22px] lg:pb-6 lg:pt-[26px]">
      <div className="flex items-center gap-3.5 lg:hidden">
        {iconDot}
        <div className="flex flex-col items-start gap-1.5">
          <h3 className="m-0 font-display text-[20px] font-extrabold leading-[1.15] tracking-[-0.02em]">{name}</h3>
          {badgeEl}
        </div>
      </div>
      <div className="hidden items-center justify-between lg:flex">
        {iconDot}
        {badgeEl}
      </div>
      <h3 className="m-0 hidden font-display text-[22px] font-extrabold leading-[1.15] tracking-[-0.02em] lg:block">
        {name}
      </h3>
      <div className="flex flex-col gap-2 text-[14.5px] leading-[1.4] text-lc-body lg:gap-[9px]">{children}</div>
    </div>
  );
}

const MODULE_COUNTS = [2, 3, 4] as const;

function PriceTable() {
  return (
    <div className="rounded-[24px] bg-white px-4 pb-2 pt-[22px] text-lc-ink lg:rounded-[28px] lg:px-8 lg:pb-3 lg:pt-7">
      <table className="w-full border-collapse">
        <caption className="mb-3 px-1 text-left font-display text-[22px] font-extrabold tracking-[-0.02em] lg:mb-4 lg:px-0 lg:text-[25px]">
          Precio por alumno, por mes
        </caption>
        <thead>
          <tr className="text-[11.5px] font-extrabold uppercase tracking-[0.06em] text-lc-subtle lg:text-[12.5px] lg:tracking-[0.08em]">
            <th scope="col" className="px-1 pb-2.5 text-left font-extrabold lg:px-0">
              Alumnos
            </th>
            {MODULE_COUNTS.map((count) => (
              <th key={count} scope="col" className="px-1 pb-2.5 text-right font-extrabold lg:px-0">
                {count} módulos
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {TIERS.map((tier) => (
            <tr key={tier.upTo} className="border-t-[1.5px] border-dashed border-[#ece6dc]">
              <th scope="row" className="px-1 py-3 text-left text-[14.5px] font-bold lg:px-0 lg:py-3.5 lg:text-[16px]">
                {tier.label}
              </th>
              {MODULE_COUNTS.map((count) => (
                <td
                  key={count}
                  className="whitespace-nowrap px-1 py-3 text-right font-display text-[16px] font-extrabold tracking-[-0.01em] lg:px-0 lg:py-3.5 lg:text-[20px]"
                >
                  {money(perStudent(tier, count))}
                </td>
              ))}
            </tr>
          ))}
          <tr className="border-t-[1.5px] border-dashed border-[#ece6dc]">
            <th scope="row" className="px-1 py-3 text-left text-[14.5px] font-bold lg:px-0 lg:py-3.5 lg:text-[16px]">
              Más de 500
            </th>
            <td colSpan={3} className="px-1 py-3 text-right text-[14.5px] text-lc-body lg:px-0 lg:py-3.5 lg:text-[15.5px]">
              Presupuesto a medida
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
