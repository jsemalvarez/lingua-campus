import type { ReactNode } from "react";
import Image from "next/image";
import { ArrowRight, Headphones, MessageCircle, Mic } from "lucide-react";
import { Nav } from "./Nav";
import { MES_LOGO_URL, Sparkle, Tag, Underlined } from "./ui";

// Hero: la práctica con IA va primero (decidido el 26/09/2026); la gestión, en el
// subtítulo y en su propia sección.

export function Hero() {
  return (
    <header id="inicio" className="lc-clip relative bg-lc-cream text-lc-ink">
      <Nav />

      <div className="mx-auto w-full max-w-[1440px]">
        <div className="flex flex-col lg:min-h-[732px] lg:flex-row lg:items-center lg:gap-12 lg:px-20">
          <div className="flex flex-col gap-5 px-5 pt-6 lg:max-w-[610px] lg:flex-1 lg:gap-7 lg:px-0 lg:pt-0">
            <Tag tone="violet">Para institutos de inglés</Tag>
            <h1 className="m-0 text-balance font-display text-[40px] font-extrabold leading-[1.02] tracking-[-0.035em] lg:text-[52px] lg:leading-none lg:tracking-[-0.04em] xl:text-[60px] min-[1440px]:text-[66px]">
              Tus alumnos pueden practicar con IA lo que vieron <Underlined>en clase.</Underlined>
            </h1>
            <p className="m-0 text-pretty text-[16.5px] leading-[1.58] text-lc-text lg:max-w-[560px] lg:text-[19px] lg:leading-[1.6]">
              Con el tema de cada clase, la IA arma la práctica: frases para decir en voz alta, un audio para
              escuchar y una conversación. El docente la revisa y la publica. Y la administración del instituto
              está en el mismo sistema.
            </p>
            <div className="mt-1 flex flex-col items-center gap-[18px] lg:flex-row lg:gap-[26px]">
              <a
                href="#contacto"
                className="flex h-14 items-center justify-center gap-2.5 self-stretch rounded-full bg-lc-violet text-[17px] font-bold text-white shadow-[0_14px_30px_rgba(75,62,240,0.30)] transition-colors hover:bg-lc-violet-deep lg:h-auto lg:self-auto lg:px-[30px] lg:py-[17px] lg:text-[17.5px]"
              >
                Pedí una demo <ArrowRight size={18} strokeWidth={2.25} aria-hidden="true" />
              </a>
              <a
                href="#como-funciona"
                className="border-b-[3px] border-lc-yellow pb-0.5 text-[16px] font-bold text-lc-ink lg:text-[16.5px]"
              >
                Mirá cómo funciona
              </a>
            </div>
          </div>

          <HeroArtMobile />
          <HeroArtDesktop />
        </div>

        <div className="flex items-center gap-3 px-5 pb-[30px] pt-[18px] lg:h-[84px] lg:justify-center lg:gap-3.5 lg:px-20 lg:py-0">
          <Image
            src={MES_LOGO_URL}
            alt=""
            width={34}
            height={34}
            className="h-[34px] w-[34px] shrink-0 rounded-[10px] bg-white object-contain"
          />
          <p className="m-0 text-[14.5px] leading-normal text-lc-text lg:text-[15.5px]">
            Lo usa <strong className="font-bold text-lc-ink">Modern English School</strong>, de Mar del Plata, con
            más de 200 alumnos.
          </p>
        </div>
      </div>
    </header>
  );
}

/* ─── Dibujo del celular con la práctica ─────────────────────────────────── */

const CHAT = [
  { from: "ia", text: "Good morning! Table for one?", delay: "0.3s" },
  { from: "alumno", text: "Yes, please. Can I see the menu?", delay: "1.1s" },
  { from: "ia", text: "Here you are. What would you like to drink?", delay: "1.9s" },
  { from: "alumno", text: "A white coffee and an orange juice, please.", delay: "2.7s" },
] as const;

function PracticePhoneScreen({ compact }: { compact: boolean }) {
  return (
    <div
      className={`flex h-full w-full flex-col overflow-hidden bg-white ${
        compact ? "gap-2.5 rounded-[34px] px-[13px] pb-[13px] pt-6" : "gap-3 rounded-[37px] px-[15px] pb-[15px] pt-[26px]"
      }`}
    >
      <div className={`flex items-center ${compact ? "gap-2" : "gap-[9px]"}`}>
        <span
          className={`flex items-center justify-center bg-lc-green font-extrabold text-white ${
            compact ? "h-[27px] w-[27px] rounded-[9px] text-[12px]" : "h-[30px] w-[30px] rounded-[10px] text-[13px]"
          }`}
        >
          D
        </span>
        <div className="flex flex-col">
          <span
            className={`font-bold uppercase tracking-[0.08em] text-lc-subtle ${compact ? "text-[9px]" : "text-[10px]"}`}
          >
            Clase en curso
          </span>
          <span
            className={`font-display font-extrabold tracking-[-0.02em] text-lc-ink ${compact ? "text-[15.5px]" : "text-[17px]"}`}
          >
            Ordering food
          </span>
        </div>
      </div>

      <div className={`grid grid-cols-3 ${compact ? "gap-[5px]" : "gap-1.5"}`}>
        {[
          { label: "Speaking", className: "bg-lc-coral-soft text-lc-coral-deep" },
          { label: "Listening", className: "bg-lc-sky-soft text-lc-sky-deep" },
          { label: "Chat", className: "bg-lc-ink text-white" },
        ].map((mode) => (
          <span
            key={mode.label}
            className={`flex items-center justify-center rounded-full font-bold ${mode.className} ${
              compact ? "h-[27px] text-[10px]" : "h-[30px] text-[11px]"
            }`}
          >
            {mode.label}
          </span>
        ))}
      </div>

      <div
        className={`flex flex-col gap-[3px] bg-lc-yellow-soft ${compact ? "rounded-[14px] px-[11px] py-[9px]" : "rounded-2xl px-3 py-2.5"}`}
      >
        <span
          className={`font-extrabold uppercase tracking-[0.1em] text-lc-yellow-deep ${compact ? "text-[9px]" : "text-[9.5px]"}`}
        >
          Escenario
        </span>
        <span className={`leading-[1.45] text-lc-body ${compact ? "text-[10.5px]" : "text-[11px]"}`}>
          Sos un mozo en un café de Londres. El alumno es un turista que quiere desayunar.
        </span>
      </div>

      <div className={`flex grow flex-col ${compact ? "gap-[7px]" : "gap-2"}`}>
        {CHAT.map((message) => (
          <span
            key={message.text}
            style={{ animationDelay: message.delay }}
            className={`lc-rise leading-[1.4] ${compact ? "max-w-[84%] px-[11px] py-[7px] text-[11px]" : "max-w-[82%] px-3 py-2 text-[11.5px]"} ${
              message.from === "ia"
                ? "self-start rounded-[16px_16px_16px_5px] bg-[#f3f1fa] text-lc-ink"
                : "self-end rounded-[16px_16px_5px_16px] bg-lc-violet text-white"
            }`}
          >
            {message.text}
          </span>
        ))}
      </div>

      <div
        className={`flex items-center rounded-full bg-[#f6f5fb] ${compact ? "gap-[7px] py-1 pl-3 pr-1" : "gap-2 py-[5px] pl-3.5 pr-[5px]"}`}
      >
        <span className={`grow text-lc-subtle ${compact ? "text-[10.5px]" : "text-[11px]"}`}>
          Escribí o hablá en inglés
        </span>
        <span
          className={`flex items-center justify-center rounded-full bg-lc-coral text-white ${compact ? "h-[31px] w-[31px]" : "h-[34px] w-[34px]"}`}
        >
          <Mic size={compact ? 14 : 15} strokeWidth={2.2} />
        </span>
      </div>
    </div>
  );
}

function SpeakingChip({ compact }: { compact: boolean }) {
  return (
    <div
      className={`lc-rise flex flex-col gap-px bg-lc-coral text-lc-ink shadow-[0_16px_34px_rgba(255,107,74,0.35)] ${
        compact ? "rounded-2xl px-[13px] py-[9px]" : "rounded-[18px] px-[15px] py-[11px]"
      }`}
      style={{ animationDelay: "0.6s" }}
    >
      <span className={`font-bold ${compact ? "text-[10.5px]" : "text-[11px]"}`}>Speaking</span>
      <span className="font-display text-[19px] font-extrabold tracking-[-0.01em]">5 de 6 frases</span>
    </div>
  );
}

function HeroArtMobile() {
  return (
    <div aria-hidden="true" className="relative mt-7 h-[600px] lg:hidden">
      <div className="absolute left-1/2 top-0 h-full w-[390px] -translate-x-1/2">
        <div className="absolute left-[30px] top-[70px] h-[330px] w-[330px] rounded-full bg-lc-peach" />
        <div className="absolute left-[250px] top-5 h-[120px] w-[150px] rounded-[60%_40%_55%_45%/50%_60%_40%_50%] bg-[#d6e8ff]" />
        <Sparkle className="absolute left-[330px] top-[470px] h-[34px] w-[34px]" />
        <div className="absolute left-[70px] top-10 h-[520px] w-[250px] rotate-[-4deg] rounded-[42px] bg-lc-ink p-[9px] shadow-[0_30px_70px_rgba(31,26,61,0.28)]">
          <PracticePhoneScreen compact />
        </div>
        <div className="absolute left-2 top-24 rotate-[-7deg]">
          <SpeakingChip compact />
        </div>
      </div>
    </div>
  );
}

function HeroArtDesktop() {
  return (
    <div
      aria-hidden="true"
      className="relative hidden h-[680px] w-[622px] shrink-0 lg:block lg:[zoom:0.62] xl:[zoom:0.76] min-[1440px]:[zoom:1]"
    >
      <div className="absolute left-[120px] top-[70px] h-[500px] w-[500px] rounded-full bg-lc-peach" />
      <div className="absolute left-[430px] top-[-20px] h-[190px] w-[250px] rounded-[60%_40%_55%_45%/50%_60%_40%_50%] bg-[#d6e8ff]" />
      <div className="absolute left-[30px] top-[560px] h-[90px] w-[150px] bg-[radial-gradient(#1f1a3d_1.6px,transparent_1.8px)] bg-[length:16px_16px] opacity-[0.18]" />
      <Sparkle className="absolute left-[600px] top-[470px] h-[46px] w-[46px]" />

      <div className="lc-float absolute left-[280px] top-[50px] h-[580px] w-[284px] rounded-[46px] bg-lc-ink p-2.5 shadow-[0_36px_80px_rgba(31,26,61,0.28)]">
        <PracticePhoneScreen compact={false} />
      </div>

      <div className="absolute left-0 top-[330px] w-[290px] rotate-[3deg]">
        <div
          className="lc-rise flex flex-col gap-3.5 rounded-[26px] bg-white p-5 shadow-[0_24px_60px_rgba(31,26,61,0.16)]"
          style={{ animationDelay: "0.15s" }}
        >
          <div className="flex flex-col gap-1">
            <span className="text-[11.5px] text-lc-subtle">Clase del jueves · Teens 2</span>
            <span className="font-display text-[18px] font-extrabold tracking-[-0.02em] text-lc-ink">
              Unit 4 · Ordering food
            </span>
            <span className="mt-1 self-start rounded-full bg-lc-violet-soft px-2.5 py-[5px] text-[10.5px] font-bold text-lc-violet-deep">
              Armada con IA · borrador
            </span>
          </div>
          <div className="flex flex-col gap-2.5">
            <TeacherRow icon={<Mic size={14} strokeWidth={2.2} />} tone="bg-lc-coral-soft text-lc-coral-deep">
              <strong className="text-lc-ink">6 frases</strong> para decir
            </TeacherRow>
            <TeacherRow icon={<Headphones size={14} strokeWidth={2.2} />} tone="bg-lc-sky-soft text-lc-sky-deep">
              <strong className="text-lc-ink">Un audio</strong> con preguntas
            </TeacherRow>
            <TeacherRow icon={<MessageCircle size={14} strokeWidth={2.2} />} tone="bg-lc-green-soft text-lc-green-deep">
              <strong className="text-lc-ink">Una charla</strong> en un café
            </TeacherRow>
          </div>
          <div className="flex justify-end gap-2">
            <span className="rounded-full border-[1.5px] border-[#e2dff0] px-3.5 py-2 text-[12.5px] font-bold text-lc-ink">
              Editar
            </span>
            <span className="rounded-full bg-lc-violet px-3.5 py-2 text-[12.5px] font-bold text-white">Publicar</span>
          </div>
        </div>
      </div>

      <div className="absolute left-40 top-[108px] rotate-[-7deg]">
        <SpeakingChip compact={false} />
      </div>
    </div>
  );
}

function TeacherRow({ icon, tone, children }: { icon: ReactNode; tone: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className={`flex h-7 w-7 items-center justify-center rounded-full ${tone}`}>{icon}</span>
      <span className="text-[12.5px] text-lc-body">{children}</span>
    </div>
  );
}
