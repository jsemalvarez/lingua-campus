import type { ReactNode } from "react";
import { Bell, CalendarCheck, Check, FileText, MessageCircle, PenLine, Receipt } from "lucide-react";
import { IconDot, Section, Sparkle, Tag, Underlined } from "./ui";

// Familias: el portal desde el celular, con el boletín firmado.

export function Families() {
  return (
    <Section id="familias" className="bg-lc-cream text-lc-ink">
      <div className="flex flex-col gap-8 pb-16 pt-[72px] lg:flex-row lg:items-center lg:gap-12 lg:py-[104px] xl:gap-[72px]">
        <FamiliesArtDesktop />

        <div className="flex flex-col gap-8 lg:min-w-0 lg:flex-1 lg:gap-10">
          <header className="flex flex-col gap-4 lg:gap-[18px]">
            <Tag tone="coral">Familias</Tag>
            <h2 className="m-0 text-balance font-display text-[35px] font-extrabold leading-[1.04] tracking-[-0.035em] lg:text-[50px] lg:leading-[1.03]">
              Las familias, al tanto sin tener que <Underlined>preguntar.</Underlined>
            </h2>
            <p className="m-0 max-w-[600px] text-pretty text-[16.5px] leading-[1.55] text-lc-text lg:text-[18.5px] lg:leading-[1.6]">
              Asistencia, notas, los temas de cada clase, el boletín y las cuotas: lo que hoy preguntan por WhatsApp, en
              un portal desde el celular.
            </p>
          </header>

          <FamiliesArtMobile />

          <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:gap-x-8 lg:gap-y-[30px]">
            <Feature tone="violet" icon={<PenLine size={20} strokeWidth={2.2} />} title="El boletín, firmado en el celular">
              La docente firma cada informe y las familias también firman los informes con el dedo.
            </Feature>
            <Feature
              tone="green"
              icon={<CalendarCheck size={20} strokeWidth={2.2} />}
              title="Asistencia y notas, clase por clase"
            >
              Ven las clases, las faltas y las notas, sin esperar al fin del trimestre.
            </Feature>
            <Feature tone="yellow" icon={<Receipt size={20} strokeWidth={2.2} />} title="Cuotas y recibos">
              Qué está pago y qué no, con el recibo de cada pago para descargar.
            </Feature>
            <Feature tone="sky" icon={<MessageCircle size={20} strokeWidth={2.2} />} title="Mensajes con el docente">
              Un canal con el docente y avisos para todo el curso, fuera del WhatsApp personal.
            </Feature>
          </div>

          <p className="m-0 border-t-[1.5px] border-dashed border-[#e8dcc8] pt-[22px] text-[15px] leading-[1.55] text-lc-text lg:pt-6 lg:text-[16px]">
            <strong className="font-bold text-lc-ink">Los más chicos entran con su DNI</strong>, aunque no tengan
            email.
          </p>
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
  tone: "violet" | "green" | "yellow" | "sky";
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3.5 lg:flex-col lg:gap-2.5">
      <IconDot tone={tone}>{icon}</IconDot>
      <div className="flex flex-col gap-1 lg:gap-2.5">
        <h3 className="m-0 font-display text-[19px] font-bold leading-[1.2] tracking-[-0.02em] lg:text-[21px]">
          {title}
        </h3>
        <p className="m-0 text-[15px] leading-[1.55] text-lc-text lg:text-[16px]">{children}</p>
      </div>
    </div>
  );
}

/* ─── Portal de las familias, dibujado ───────────────────────────────────── */

function PortalScreen({ compact }: { compact: boolean }) {
  const grade = compact ? "text-[11.5px]" : "text-[12px]";
  const pill = compact ? "px-2" : "px-[9px]";
  return (
    <div
      className={`flex h-full w-full flex-col overflow-hidden bg-white ${
        compact ? "gap-[11px] rounded-[34px] px-[13px] pb-[13px] pt-6" : "gap-[13px] rounded-[37px] px-[15px] pb-[15px] pt-[26px]"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[7px] lg:gap-2">
          <span
            className={`flex items-center justify-center bg-lc-green font-extrabold text-white ${
              compact ? "h-[25px] w-[25px] rounded-lg text-[11px]" : "h-[27px] w-[27px] rounded-[9px] text-[12px]"
            }`}
          >
            D
          </span>
          <span className={`font-bold text-lc-ink ${compact ? "text-[12px]" : "text-[13px]"}`}>Instituto Demo</span>
        </div>
        <Bell size={compact ? 15 : 17} strokeWidth={2} className="text-lc-subtle" />
      </div>

      <div className={`flex items-center ${compact ? "gap-[9px]" : "gap-2.5"}`}>
        <span
          className={`flex items-center justify-center rounded-full bg-lc-coral-soft font-display font-extrabold text-lc-coral-deep ${
            compact ? "h-[35px] w-[35px] text-[15px]" : "h-[38px] w-[38px] text-[16px]"
          }`}
        >
          S
        </span>
        <div className="flex flex-col gap-px">
          <span className={`font-display font-extrabold tracking-[-0.01em] text-lc-ink ${compact ? "text-[14px]" : "text-[15px]"}`}>
            Sofía Romero
          </span>
          <span className={`text-lc-subtle ${compact ? "text-[10.5px]" : "text-[11px]"}`}>Kids 3 · Miss Laura</span>
        </div>
      </div>

      <div className={`flex flex-col bg-lc-cream ${compact ? "gap-2 rounded-2xl p-3" : "gap-[9px] rounded-[18px] p-3.5"}`}>
        <div className="flex items-center gap-1.5 lg:gap-[7px]">
          <FileText size={compact ? 14 : 15} strokeWidth={2.2} className="text-lc-violet-deep" />
          <span className={`font-display font-extrabold text-lc-ink ${compact ? "text-[13px]" : "text-[14px]"}`}>
            Informe · 2.º trimestre
          </span>
        </div>
        <GradeRow className={grade} pill={`${pill} bg-lc-green-soft text-lc-green-deep`} label="Speaking" value="Very good" />
        <GradeRow className={grade} pill={`${pill} bg-lc-violet-soft text-lc-violet-deep`} label="Listening" value="Excellent" />
        <GradeRow className={grade} pill={`${pill} bg-lc-yellow-soft text-lc-yellow-deep`} label="Writing" value="Good" />
        <p className={`m-0 italic leading-normal text-lc-body ${compact ? "text-[10.5px]" : "text-[11px]"}`}>
          “Sofía participa mucho y ya se anima a hablar sin leer.”
        </p>
        <div
          className={`flex items-center gap-[5px] border-t border-[#efe6d8] font-bold text-lc-green-deep ${
            compact ? "pt-[7px] text-[10.5px]" : "pt-2 text-[11px]"
          }`}
        >
          <Check size={compact ? 12 : 13} strokeWidth={2.5} />
          <span>Firmado por Laura Gómez, docente</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <span
          className={`font-bold uppercase tracking-[0.08em] text-lc-subtle ${compact ? "text-[9.5px]" : "text-[10px]"}`}
        >
          Tu firma
        </span>
        <div
          className={`flex items-center justify-center border-2 border-dashed border-[#d9d3ec] bg-white ${
            compact ? "h-[58px] rounded-[13px]" : "h-16 rounded-[14px]"
          }`}
        >
          <svg width={compact ? 128 : 140} height={compact ? 38 : 42} viewBox="0 0 150 46" fill="none">
            <path
              d="M6 34 C 16 8, 26 44, 38 24 S 56 10, 66 30 S 88 40, 98 20 S 120 26, 144 22"
              stroke="#1f1a3d"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      <span
        className={`flex items-center justify-center rounded-full bg-lc-violet font-bold text-white ${
          compact ? "h-10 text-[12.5px]" : "h-[42px] text-[13px]"
        }`}
      >
        Confirmar que lo leí
      </span>
    </div>
  );
}

function GradeRow({ className, pill, label, value }: { className: string; pill: string; label: string; value: string }) {
  return (
    <div className={`flex items-center justify-between ${className}`}>
      <span className="text-lc-body">{label}</span>
      <span className={`rounded-full py-0.5 font-bold ${pill}`}>{value}</span>
    </div>
  );
}

function AttendanceCard({ showBar }: { showBar: boolean }) {
  return (
    <>
      <div className="flex items-center gap-[7px]">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-lc-green-soft text-lc-green-deep">
          <Check size={13} strokeWidth={2.4} />
        </span>
        <span className="text-[12px] font-bold text-lc-ink lg:text-[11.5px]">Asistencia</span>
      </div>
      <span className="font-display text-[29px] font-extrabold tracking-[-0.03em] text-lc-ink lg:text-[32px]">94 %</span>
      {showBar && (
        <div className="h-[7px] overflow-hidden rounded-full bg-[#f1ece4]">
          <div className="h-full w-[94%] rounded-full bg-lc-green" />
        </div>
      )}
      <span className="text-[11px] text-lc-subtle">2 faltas en el trimestre</span>
    </>
  );
}

function FeeCard() {
  return (
    <>
      <div className="flex items-center gap-[7px]">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-lc-yellow-soft text-lc-yellow-deep">
          <Receipt size={13} strokeWidth={2.2} />
        </span>
        <span className="text-[12px] font-bold text-lc-ink lg:text-[11.5px]">Cuota de sept.</span>
      </div>
      <span className="self-start rounded-full bg-lc-green-soft px-[11px] py-1 text-[12px] font-extrabold text-lc-green-deep">
        Pagada
      </span>
      <span className="text-[11.5px] font-bold text-lc-violet-deep">Descargar recibo</span>
    </>
  );
}

function FamiliesArtMobile() {
  return (
    <div aria-hidden="true" className="flex flex-col gap-3.5 lg:hidden">
      <div className="relative h-[610px]">
        <div className="absolute left-1/2 top-0 h-full w-[350px] -translate-x-1/2">
          <div className="absolute left-[15px] top-[90px] h-80 w-80 rounded-full bg-lc-peach" />
          <Sparkle className="absolute left-[318px] top-[26px] h-8 w-8" />
          <div className="absolute left-[50px] top-5 h-[570px] w-[262px] rotate-[3deg] rounded-[42px] bg-lc-ink p-[9px] shadow-[0_30px_70px_rgba(31,26,61,0.26)]">
            <PortalScreen compact />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-[7px] rounded-[20px] bg-white p-[15px] shadow-[0_14px_34px_rgba(31,26,61,0.10)]">
          <AttendanceCard showBar={false} />
        </div>
        <div className="flex flex-col gap-2 rounded-[20px] bg-white p-[15px] shadow-[0_14px_34px_rgba(31,26,61,0.10)]">
          <FeeCard />
        </div>
      </div>
      <div className="flex gap-3 rounded-[20px] bg-white px-4 py-[15px] shadow-[0_14px_34px_rgba(31,26,61,0.10)]">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lc-sky-soft text-[12px] font-extrabold text-lc-sky-deep">
          LG
        </span>
        <div className="flex flex-col gap-[3px]">
          <div className="flex items-baseline gap-2">
            <span className="text-[13px] font-bold text-lc-ink">Miss Laura</span>
            <span className="text-[10.5px] text-lc-subtle">14:32</span>
          </div>
          <span className="text-[13px] leading-[1.45] text-lc-body">Mañana traigan el cuento que armamos en clase.</span>
        </div>
      </div>
    </div>
  );
}

function FamiliesArtDesktop() {
  return (
    <div
      aria-hidden="true"
      className="relative hidden h-[720px] w-[560px] shrink-0 lg:block lg:[zoom:0.62] xl:[zoom:0.8] min-[1440px]:[zoom:1]"
    >
      <div className="absolute left-[50px] top-[90px] h-[460px] w-[460px] rounded-full bg-lc-peach" />
      <div className="absolute left-5 top-[590px] h-[84px] w-[140px] bg-[radial-gradient(#1f1a3d_1.6px,transparent_1.8px)] bg-[length:16px_16px] opacity-[0.18]" />
      <Sparkle className="absolute left-[500px] top-5 h-10 w-10" />

      <div className="absolute left-[135px] top-[30px] h-[630px] w-[290px] rotate-[3deg] rounded-[46px] bg-lc-ink p-2.5 shadow-[0_36px_80px_rgba(31,26,61,0.28)]">
        <PortalScreen compact={false} />
      </div>

      <div className="absolute left-0 top-[200px] flex w-[156px] rotate-[-4deg] flex-col gap-2 rounded-[22px] bg-white p-[15px] shadow-[0_20px_50px_rgba(31,26,61,0.16)]">
        <AttendanceCard showBar />
      </div>

      <div className="absolute left-[404px] top-[96px] flex w-[156px] rotate-[4deg] flex-col gap-[9px] rounded-[22px] bg-white p-[15px] shadow-[0_20px_50px_rgba(31,26,61,0.16)]">
        <FeeCard />
      </div>

      <div className="absolute left-[392px] top-[470px] flex w-[168px] rotate-[-3deg] flex-col gap-[7px] rounded-[22px] bg-white p-[15px] shadow-[0_20px_50px_rgba(31,26,61,0.16)]">
        <div className="flex items-center gap-[7px]">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-lc-sky-soft text-[9.5px] font-extrabold text-lc-sky-deep">
            LG
          </span>
          <span className="text-[11.5px] font-bold text-lc-ink">Miss Laura</span>
          <span className="ml-auto text-[10px] text-lc-subtle">14:32</span>
        </div>
        <span className="text-[12px] leading-[1.45] text-lc-body">Mañana traigan el cuento que armamos en clase.</span>
      </div>
    </div>
  );
}
