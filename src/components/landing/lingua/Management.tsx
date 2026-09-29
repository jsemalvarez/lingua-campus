import type { ReactNode } from "react";
import { BarChart3, CalendarCheck, CircleAlert, Clock, FilePlus, ShieldCheck, Wallet } from "lucide-react";
import { IconDot, Section, Sparkle, Tag, Underlined } from "./ui";

// Gestión: cobranzas, caja y el registro que no se borra, con el panel de pagos dibujado.

export function Management() {
  return (
    <Section id="gestion" className="bg-lc-ink text-white">
      <div className="flex flex-col gap-8 pb-16 pt-[72px] lg:gap-[72px] lg:pb-[104px] lg:pt-28">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:gap-16">
          <div className="flex flex-col gap-8 lg:min-w-0 lg:flex-1 lg:gap-10 xl:w-[520px] xl:flex-none">
            <header className="flex flex-col gap-4 lg:gap-[18px]">
              <Tag tone="green">Gestión</Tag>
              <h2 className="m-0 text-balance font-display text-[35px] font-extrabold leading-[1.04] tracking-[-0.035em] lg:text-[50px] lg:leading-[1.03]">
                Sabés quién debe, cuánto entró y <Underlined>cuánto te queda.</Underlined>
              </h2>
              <p className="m-0 text-pretty text-[16.5px] leading-[1.55] text-lc-lavender lg:text-[18.5px] lg:leading-[1.6]">
                Cuotas, morosos, sueldos y caja, en el mismo sistema donde los docentes toman asistencia y cargan las
                clases.
              </p>
            </header>

            <div className="flex flex-col gap-[22px] lg:gap-[26px]">
              <Feature tone="green" icon={<Wallet size={20} strokeWidth={2.2} />} title="Cobranzas y morosos">
                Cuotas, matrículas y exámenes, con pagos parciales, recargos y becas. Recibo en PDF y reporte de
                deudores para imprimir.
              </Feature>
              <Feature tone="yellow" icon={<BarChart3 size={20} strokeWidth={2.2} />} title="La caja del mes">
                Gastos, sueldos de los docentes y la rentabilidad de cada mes, sin armar planillas.
              </Feature>
              <Feature tone="sky" icon={<ShieldCheck size={20} strokeWidth={2.2} />} title="Todo queda registrado">
                Un pago mal cargado se anula, no se borra: queda a la vista, y la caja no pierde nada.
              </Feature>
            </div>
          </div>

          <PaymentsMobile />
          <PaymentsDesktop />
        </div>

        <div className="flex flex-col gap-4 border-t border-white/[0.12] pt-6 lg:grid lg:grid-cols-3 lg:gap-6 lg:pt-8">
          <Extra tone="green" icon={<CalendarCheck size={18} strokeWidth={2.2} />}>
            <strong className="font-bold text-white">Asistencia por clase</strong>, con lista o con el QR de cada
            alumno.
          </Extra>
          <Extra tone="violet" icon={<FilePlus size={18} strokeWidth={2.2} />}>
            <strong className="font-bold text-white">Pre-inscripción online</strong>, desde la web de tu instituto.
          </Extra>
          <Extra tone="yellow" icon={<Clock size={18} strokeWidth={2.2} />}>
            <strong className="font-bold text-white">Horarios y aulas</strong> de cada curso, en el mismo lugar.
          </Extra>
        </div>
      </div>
    </Section>
  );
}

function Feature({
  tone,
  icon,
  title,
  children,
}: {
  tone: "green" | "yellow" | "sky";
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3.5 lg:gap-4">
      <IconDot tone={tone}>{icon}</IconDot>
      <div className="flex flex-col gap-1 lg:gap-[5px]">
        <h3 className="m-0 font-display text-[19px] font-bold leading-[1.2] tracking-[-0.02em] lg:text-[21px]">
          {title}
        </h3>
        <p className="m-0 text-[15px] leading-[1.55] text-lc-lavender lg:text-[16px]">{children}</p>
      </div>
    </div>
  );
}

function Extra({ tone, icon, children }: { tone: "green" | "violet" | "yellow"; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3 lg:gap-3.5">
      <IconDot tone={tone} size="sm">
        {icon}
      </IconDot>
      <p className="m-0 text-[15px] leading-normal text-[#e6e1f5] lg:text-[16px]">{children}</p>
    </div>
  );
}

/* ─── Panel de pagos, dibujado ───────────────────────────────────────────── */

const MOVEMENTS = [
  { concept: "Cuota septiembre · Sofía Romero", short: "Cuota sept. · Sofía Romero", method: "Transferencia", date: "24/09", amount: "+ $ 48.000", kind: "in" },
  { concept: "Sueldo · Laura Gómez", short: "Sueldo · Laura Gómez", method: "Honorarios docentes", shortMethod: "Honorarios", date: "23/09", amount: "− $ 520.000", kind: "out" },
  { concept: "Cuota septiembre · Joaquín Méndez", short: "Cuota sept. · J. Méndez", method: "Efectivo", date: "22/09", amount: "+ $ 45.000", kind: "void" },
  { concept: "Cuota septiembre · Joaquín Méndez", short: "Cuota sept. · J. Méndez", method: "Efectivo", date: "22/09", amount: "+ $ 45.000", kind: "in" },
  { concept: "Derecho de examen · Valentina Sosa", short: null, method: "Transferencia", date: "21/09", amount: "+ $ 38.000", kind: "in" },
] as const;

function amountColor(kind: string) {
  if (kind === "out") return "text-lc-coral-deep";
  if (kind === "void") return "text-lc-subtle line-through";
  return "text-lc-green-deep";
}

function DebtorsCard({ compact }: { compact: boolean }) {
  return (
    <div
      className={`flex items-center bg-white text-lc-ink shadow-[0_24px_60px_rgba(0,0,0,0.35)] ${
        compact ? "gap-3 rounded-[20px] px-4 py-3.5" : "gap-3.5 rounded-[22px] px-[18px] py-4"
      }`}
    >
      <span
        className={`flex shrink-0 items-center justify-center rounded-full bg-lc-coral-soft text-lc-coral-deep ${
          compact ? "h-10 w-10" : "h-[42px] w-[42px]"
        }`}
      >
        <CircleAlert size={compact ? 19 : 20} strokeWidth={2.2} />
      </span>
      <div className="flex grow flex-col gap-0.5">
        <span className={`font-display font-extrabold text-lc-ink ${compact ? "text-[14.5px]" : "text-[15px]"}`}>
          Reporte de deudores
        </span>
        <span className={`text-lc-subtle ${compact ? "text-[11.5px]" : "text-[12px]"}`}>23 alumnos · $ 1.338.000</span>
      </div>
      <span className="text-[12px] font-extrabold text-lc-violet">PDF</span>
    </div>
  );
}

function PaymentsMobile() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3.5 lg:hidden">
      <div className="overflow-hidden rounded-[24px] bg-white text-lc-ink shadow-[0_28px_70px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between gap-2.5 px-4 pb-3 pt-4">
          <div className="flex items-center gap-2">
            <span className="font-display text-[20px] font-extrabold tracking-[-0.02em]">Pagos</span>
            <span className="rounded-full bg-[#f6f1e9] px-2.5 py-1 text-[11px] font-bold text-lc-body">Septiembre</span>
          </div>
          <span className="rounded-full bg-lc-violet px-[13px] py-2 text-[12px] font-bold text-white">Registrar pago</span>
        </div>
        <div className="flex flex-col gap-2 px-4 pb-3.5">
          <SummaryRow className="bg-lc-sky-soft text-lc-sky-deep" label="Cobrado en septiembre" value="$ 4.812.000" />
          <SummaryRow className="bg-lc-coral-soft text-lc-coral-deep" label="Gastos operativos" value="$ 3.516.000" />
          <SummaryRow className="bg-lc-green-soft text-lc-green-deep" label="Rentabilidad neta" value="+ $ 1.296.000" />
        </div>
        <Progress label="78 %" compact />
        <div className="flex flex-col border-t border-[#f0ebe3]">
          {MOVEMENTS.filter((row) => row.short).map((row, index) => (
            <div
              key={`${row.short}-${index}`}
              className={`flex items-center justify-between gap-2.5 px-4 py-[11px] ${index > 0 ? "border-t border-[#f4efe8]" : ""} ${
                row.kind === "void" ? "opacity-55" : ""
              }`}
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[12.5px] font-bold ${row.kind === "void" ? "text-lc-subtle line-through" : "text-lc-ink"}`}
                  >
                    {row.short}
                  </span>
                  {row.kind === "void" && <VoidBadge compact />}
                </div>
                <span className="text-[11px] text-lc-subtle">
                  {"shortMethod" in row ? row.shortMethod : row.method} · {row.date}
                </span>
              </div>
              <span className={`text-[12.5px] font-bold ${amountColor(row.kind)}`}>{row.amount}</span>
            </div>
          ))}
        </div>
      </div>
      <DebtorsCard compact />
    </div>
  );
}

function PaymentsDesktop() {
  return (
    <div
      aria-hidden="true"
      className="relative hidden h-[670px] w-[696px] shrink-0 lg:block lg:[zoom:0.62] xl:[zoom:0.77] min-[1440px]:[zoom:1]"
    >
      <div className="absolute left-[470px] top-[-40px] h-[260px] w-[260px] rounded-full bg-[rgba(255,216,196,0.16)]" />
      <Sparkle className="absolute left-[650px] top-[600px] h-10 w-10" />

      <div className="absolute left-0 top-0 w-[696px] overflow-hidden rounded-[26px] bg-white text-lc-ink shadow-[0_40px_90px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <span className="font-display text-[23px] font-extrabold tracking-[-0.02em]">Pagos</span>
            <span className="rounded-full bg-[#f6f1e9] px-3 py-1.5 text-[12.5px] font-bold text-lc-body">
              Septiembre 2026
            </span>
          </div>
          <span className="rounded-full bg-lc-violet px-4 py-2.5 text-[13px] font-bold text-white">Registrar pago</span>
        </div>
        <div className="grid grid-cols-3 gap-3 px-6 pb-4">
          <SummaryTile className="bg-lc-sky-soft text-lc-sky-deep" label="Cobrado en septiembre" value="$ 4.812.000" />
          <SummaryTile className="bg-lc-coral-soft text-lc-coral-deep" label="Gastos operativos" value="$ 3.516.000" />
          <SummaryTile className="bg-lc-green-soft text-lc-green-deep" label="Rentabilidad neta" value="+ $ 1.296.000" />
        </div>
        <Progress label="$ 4.812.000 de $ 6.150.000" compact={false} />
        <div className="border-t border-[#f0ebe3]">
          <div className="grid grid-cols-[minmax(0,1fr)_80px_120px] gap-3 bg-[#fcf8f2] px-6 py-[11px] text-[11px] font-bold uppercase tracking-[0.06em] text-lc-subtle">
            <span>Concepto / Referencia</span>
            <span>Fecha</span>
            <span className="text-right">Monto</span>
          </div>
          {MOVEMENTS.map((row, index) => (
            <div
              key={`${row.concept}-${index}`}
              className={`grid grid-cols-[minmax(0,1fr)_80px_120px] items-center gap-3 border-t border-[#f4efe8] px-6 py-[11px] ${
                index === MOVEMENTS.length - 1 ? "pb-4" : ""
              } ${row.kind === "void" ? "opacity-55" : ""}`}
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[13.5px] font-bold ${row.kind === "void" ? "text-lc-subtle line-through" : "text-lc-ink"}`}
                  >
                    {row.concept}
                  </span>
                  {row.kind === "void" && <VoidBadge compact={false} />}
                </div>
                <span className="text-[11.5px] text-lc-subtle">{row.method}</span>
              </div>
              <span className="text-[12.5px] text-lc-subtle">{row.date}</span>
              <span className={`text-right text-[13.5px] font-bold ${amountColor(row.kind)}`}>{row.amount}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="absolute left-8 top-[568px] w-[306px] rotate-[-2deg]">
        <DebtorsCard compact={false} />
      </div>
    </div>
  );
}

function SummaryRow({ className, label, value }: { className: string; label: string; value: string }) {
  return (
    <div className={`flex items-center justify-between rounded-[14px] px-[13px] py-2.5 ${className}`}>
      <span className="text-[12px] font-bold">{label}</span>
      <span className="font-display text-[17px] font-extrabold">{value}</span>
    </div>
  );
}

function SummaryTile({ className, label, value }: { className: string; label: string; value: string }) {
  return (
    <div className={`flex flex-col gap-1.5 rounded-[18px] px-4 py-[15px] ${className}`}>
      <span className="text-[12px] font-bold">{label}</span>
      <span className="font-display text-[24px] font-extrabold tracking-[-0.02em]">{value}</span>
    </div>
  );
}

function Progress({ label, compact }: { label: string; compact: boolean }) {
  return (
    <div className={`flex flex-col ${compact ? "gap-[7px] px-4 pb-3.5" : "gap-2 px-6 pb-[18px]"}`}>
      <div className={`flex justify-between ${compact ? "text-[11.5px]" : "text-[12.5px]"}`}>
        <span className="font-bold text-lc-ink">Progreso de cobro</span>
        <span className="text-lc-subtle">{label}</span>
      </div>
      <div className={`overflow-hidden rounded-full bg-[#f1ece4] ${compact ? "h-[9px]" : "h-2.5"}`}>
        <div className="h-full w-[78%] rounded-full bg-lc-violet" />
      </div>
    </div>
  );
}

function VoidBadge({ compact }: { compact: boolean }) {
  return (
    <span
      className={`rounded-full border-[1.5px] border-lc-coral-deep font-extrabold text-lc-coral-deep ${
        compact ? "px-1.5 py-px text-[9.5px]" : "px-[7px] py-px text-[10px]"
      }`}
    >
      ANULADO
    </span>
  );
}
