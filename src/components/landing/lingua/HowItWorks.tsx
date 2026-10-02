import type { ReactNode } from "react";
import { Headphones, MessageCircle, Mic, Sparkles } from "lucide-react";
import { Section, Tag, Underlined } from "./ui";

// Cómo funciona la práctica: de la clase cargada a la práctica del alumno en casa.

export function HowItWorks() {
  return (
    <Section id="como-funciona" className="bg-white text-lc-ink">
      <div className="flex flex-col gap-8 pb-16 pt-[72px] lg:gap-14 lg:pb-[104px] lg:pt-28">
        <header className="flex max-w-[820px] flex-col gap-4 lg:gap-[18px]">
          <Tag tone="yellow">Cómo funciona</Tag>
          <h2 className="m-0 text-balance font-display text-[35px] font-extrabold leading-[1.04] tracking-[-0.035em] lg:text-[52px] lg:leading-[1.02]">
            De la clase de hoy a la práctica <Underlined>en casa.</Underlined>
          </h2>
          <p className="m-0 max-w-[680px] text-pretty text-[16.5px] leading-[1.55] text-lc-text lg:text-[19px] lg:leading-[1.6]">
            El docente no la arma desde cero, y a los alumnos no les llega nada sin que el docente lo revise.
          </p>
        </header>

        <ol className="m-0 grid list-none grid-cols-1 gap-4 p-0 lg:grid-cols-2 lg:gap-5 xl:grid-cols-4">
          <Step number="1" tone="bg-lc-violet-soft text-lc-violet-deep" title="El docente carga la clase">
            <p className="m-0 text-[15.5px] leading-[1.55] text-lc-text lg:text-[16px]">
              El tema y el contenido de lo que se dio.
            </p>
            <MockCard>
              <span className="text-[11.5px] text-lc-subtle">Jueves 25/09 · Teens 2</span>
              <span className="font-display text-[16px] font-extrabold tracking-[-0.01em] text-lc-ink">
                Unit 4 · Ordering food
              </span>
              <span className="text-[12.5px] leading-normal text-lc-body">
                Food and drinks. I&apos;d like… / Can I have…? / How much is it?
              </span>
            </MockCard>
          </Step>

          <Step number="2" tone="bg-lc-yellow-soft text-lc-yellow-deep" title="La IA arma la práctica">
            <p className="m-0 text-[15.5px] leading-[1.55] text-lc-text lg:text-[16px]">
              Con un botón, a partir de esa clase: frases para decir, un audio para escuchar y una conversación.
            </p>
            <MockCard gap="gap-3">
              <span className="inline-flex items-center gap-[7px] self-start rounded-full bg-lc-violet px-[13px] py-2 text-[12.5px] font-bold text-white">
                <Sparkles size={13} strokeWidth={2} aria-hidden="true" />
                Generar práctica
              </span>
              <div className="flex flex-col gap-2 text-[12.5px]">
                <ModeRow dot="bg-lc-coral" label="Speaking" detail="6 frases" />
                <ModeRow dot="bg-[#3a8dff]" label="Listening" detail="audio con preguntas" />
                <ModeRow dot="bg-lc-green" label="Chat" detail="un mozo en un café" />
              </div>
            </MockCard>
          </Step>

          <Step number="3" tone="bg-lc-green-soft text-lc-green-deep" title="El docente la revisa y la publica">
            <p className="m-0 text-[15.5px] leading-[1.55] text-lc-text lg:text-[16px]">
              Puede cambiar cualquier parte. Hasta que la publica, los alumnos no la ven.
            </p>
            <MockCard gap="gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold uppercase tracking-[0.08em] text-lc-subtle">Frase 3 de 6</span>
                <span className="rounded-xl bg-lc-cream px-[11px] py-[9px] text-[13.5px] leading-[1.45] text-lc-ink">
                  Can I have a glass of water, please?
                </span>
              </div>
              <div className="flex justify-end gap-2">
                <span className="rounded-full border-[1.5px] border-[#e2dff0] px-[13px] py-[7px] text-[12.5px] font-bold text-lc-ink">
                  Editar
                </span>
                <span className="rounded-full bg-lc-violet px-[13px] py-[7px] text-[12.5px] font-bold text-white">
                  Publicar
                </span>
              </div>
            </MockCard>
          </Step>

          <Step number="4" tone="bg-lc-coral-soft text-lc-coral-deep" title="El alumno practica desde el celular">
            <p className="m-0 text-[15.5px] leading-[1.55] text-lc-text lg:text-[16px]">
              En casa, sobre lo que vio en clase: habla, escucha y conversa con la IA en inglés.
            </p>
            <div aria-hidden="true" className="mt-1 grid grid-cols-3 gap-2 xl:mt-auto">
              <ModeTile className="bg-lc-coral-soft text-lc-coral-deep" icon={<Mic size={20} strokeWidth={2.2} />}>
                Speaking
              </ModeTile>
              <ModeTile className="bg-lc-sky-soft text-lc-sky-deep" icon={<Headphones size={20} strokeWidth={2.2} />}>
                Listening
              </ModeTile>
              <ModeTile
                className="bg-lc-green-soft text-lc-green-deep"
                icon={<MessageCircle size={20} strokeWidth={2.2} />}
              >
                Chat
              </ModeTile>
            </div>
          </Step>
        </ol>

        <div className="flex flex-col gap-[18px] rounded-[28px] bg-lc-ink px-[22px] py-7 text-white lg:flex-row lg:items-center lg:gap-12 lg:rounded-[30px] lg:px-[38px] lg:py-[34px]">
          <div className="flex flex-col gap-2 lg:w-[440px] lg:shrink-0">
            <h3 className="m-0 font-display text-[23px] font-extrabold leading-[1.15] tracking-[-0.025em] lg:text-[27px]">
              Y el docente ve cómo le fue al grupo.
            </h3>
            <p className="m-0 text-[15.5px] leading-[1.55] text-lc-lavender lg:text-[16px]">
              Cuántos practicaron y en qué clase costó más, para retomarlo en el aula.
            </p>
          </div>
          <div
            aria-hidden="true"
            className="flex flex-col rounded-[18px] bg-white/[0.07] lg:grid lg:grow lg:grid-cols-3 lg:gap-3.5 lg:rounded-none lg:bg-transparent"
          >
            <GroupStat label="Sesiones" value="46" />
            <GroupStat label="Participaron" value="14 de 18" />
            <GroupStat label="Costó más" value="Unit 3 · Past simple" highlight />
          </div>
        </div>
      </div>
    </Section>
  );
}

function Step({
  number,
  tone,
  title,
  children,
}: {
  number: string;
  tone: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <li className="flex flex-col gap-3 rounded-[26px] bg-lc-cream px-5 pb-5 pt-6 lg:gap-3.5 lg:rounded-[28px] lg:px-6 lg:pb-6 lg:pt-7 xl:min-h-[450px]">
      <span
        className={`flex h-[42px] w-[42px] items-center justify-center rounded-full font-display text-[19px] font-extrabold lg:h-[46px] lg:w-[46px] lg:text-[21px] ${tone}`}
      >
        {number}
      </span>
      <h3 className="m-0 mt-0.5 font-display text-[21px] font-bold leading-[1.15] tracking-[-0.02em] lg:mt-1 lg:text-[23px]">
        {title}
      </h3>
      {children}
    </li>
  );
}

function MockCard({ gap = "gap-1.5", children }: { gap?: string; children: ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className={`mt-1 flex flex-col rounded-[18px] bg-white px-4 py-[15px] shadow-[0_1px_2px_rgba(31,26,61,0.06),0_10px_24px_rgba(31,26,61,0.06)] xl:mt-auto ${gap}`}
    >
      {children}
    </div>
  );
}

function ModeRow({ dot, label, detail }: { dot: string; label: string; detail: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${dot}`} />
      <span className="font-bold text-lc-ink">{label}</span>
      <span className="ml-auto text-lc-subtle">{detail}</span>
    </div>
  );
}

function ModeTile({ className, icon, children }: { className: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className={`flex h-[78px] flex-col items-center justify-center gap-[7px] rounded-2xl ${className}`}>
      {icon}
      <span className="text-[11.5px] font-bold">{children}</span>
    </div>
  );
}

function GroupStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-white/10 px-[17px] py-[15px] first:border-t-0 lg:flex-col lg:items-start lg:justify-start lg:gap-1.5 lg:rounded-[20px] lg:border-t-0 lg:bg-white/[0.07] lg:px-[19px] lg:py-[17px]">
      <span className="text-[11.5px] font-bold uppercase tracking-[0.08em] text-lc-lavender">{label}</span>
      <span
        className={`font-display font-extrabold ${
          highlight
            ? "text-[16px] leading-[1.2] text-[#ff8a6e] lg:text-[20px]"
            : "text-[21px] tracking-[-0.02em] text-white lg:text-[32px]"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
