import type { ReactNode } from "react";
import { Globe, GraduationCap, MessageCircle, Smartphone } from "lucide-react";
import { IconDot, Section, Sparkle, Tag, Underlined } from "./ui";

// Tu marca: la web, el campus y la app del instituto, con su nombre y su logo.

export function YourBrand() {
  return (
    <Section id="tu-marca" className="bg-white text-lc-ink">
      <div className="flex flex-col gap-8 pb-16 pt-[72px] lg:flex-row lg:items-center lg:gap-16 lg:py-28">
        <div className="flex flex-col gap-8 lg:min-w-0 lg:flex-1 lg:gap-10 xl:w-[520px] xl:flex-none">
          <header className="flex flex-col gap-4 lg:gap-[18px]">
            <Tag tone="sky">Tu marca</Tag>
            <h2 className="m-0 text-balance font-display text-[35px] font-extrabold leading-[1.04] tracking-[-0.035em] lg:text-[50px] lg:leading-[1.03]">
              Tu instituto, con tu nombre y <Underlined>tu logo.</Underlined>
            </h2>
            <p className="m-0 text-pretty text-[16.5px] leading-[1.55] text-lc-text lg:text-[18.5px] lg:leading-[1.6]">
              Las familias entran a la web de tu instituto, a tu campus y a tu app. Lingua Campus trabaja atrás.
            </p>
          </header>

          <BrandArtMobile />

          <div className="flex flex-col gap-[22px] lg:gap-[26px]">
            <Feature tone="sky" icon={<Globe size={20} strokeWidth={2.2} />} title="Tu web">
              Con tus cursos, tus datos de contacto, botón de WhatsApp y la pre-inscripción online.
            </Feature>
            <Feature tone="violet" icon={<GraduationCap size={20} strokeWidth={2.2} />} title="Tu campus">
              El ingreso y los portales muestran tu logo, en tu propio dominio o en uno nuestro.
            </Feature>
            <Feature tone="coral" icon={<Smartphone size={20} strokeWidth={2.2} />} title="Tu app">
              Las familias la instalan en el celular desde el navegador, sin pasar por ninguna tienda, con tu nombre y
              tu ícono.
            </Feature>
          </div>

          <p className="m-0 border-t-[1.5px] border-dashed border-[#e6e1f2] pt-5 text-[14px] leading-[1.55] text-lc-subtle lg:pt-[22px] lg:text-[14.5px]">
            La app con tu nombre y tu ícono requiere que el campus esté en tu propio dominio.
          </p>
        </div>

        <BrandArtDesktop />
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
  tone: "sky" | "violet" | "coral";
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
        <p className="m-0 text-[15px] leading-[1.55] text-lc-text lg:text-[16px]">{children}</p>
      </div>
    </div>
  );
}

/* ─── La marca del instituto, dibujada ───────────────────────────────────── */

const DEMO_GREEN = "bg-[#1e8e6a]";

function DemoTile({ className }: { className: string }) {
  return (
    <span className={`flex items-center justify-center font-extrabold text-white ${DEMO_GREEN} ${className}`}>D</span>
  );
}

function BrowserWindow({ compact }: { compact: boolean }) {
  return (
    <div
      className={`overflow-hidden bg-white text-[#14213d] ${
        compact
          ? "rounded-2xl shadow-[0_24px_60px_rgba(31,26,61,0.16),0_0_0_1px_rgba(31,26,61,0.06)]"
          : "rounded-[20px] shadow-[0_30px_80px_rgba(31,26,61,0.16),0_0_0_1px_rgba(31,26,61,0.06)]"
      }`}
    >
      <div className={`flex items-center bg-[#f6f3ee] ${compact ? "h-8 gap-2 px-2.5" : "h-[42px] gap-3 px-3.5"}`}>
        <div className={`flex ${compact ? "gap-1" : "gap-1.5"}`}>
          {["bg-[#ff8a6e]", "bg-lc-yellow", "bg-lc-green"].map((color) => (
            <span key={color} className={`rounded-full ${color} ${compact ? "h-2 w-2" : "h-[11px] w-[11px]"}`} />
          ))}
        </div>
        <span
          className={`flex grow items-center justify-center rounded-full bg-white font-semibold text-lc-body ${
            compact ? "h-5 text-[10px]" : "h-[26px] text-[12px]"
          }`}
        >
          institutodemo.com.ar
        </span>
      </div>

      <div className={`flex items-center justify-between ${compact ? "px-3.5 py-2.5" : "px-7 py-4"}`}>
        <div className={`flex items-center ${compact ? "gap-[7px]" : "gap-2.5"}`}>
          <DemoTile className={compact ? "h-6 w-6 rounded-lg text-[12px]" : "h-[34px] w-[34px] rounded-[11px] text-[16px]"} />
          <span className={`font-extrabold ${compact ? "text-[12px]" : "text-[16px]"}`}>Instituto Demo</span>
        </div>
        {compact ? (
          <span className={`rounded-full px-2.5 py-[5px] text-[10.5px] font-bold text-white ${DEMO_GREEN}`}>Ingresar</span>
        ) : (
          <div className="flex items-center gap-5 text-[13px] font-semibold text-[#4b5563]">
            <span>Cursos</span>
            <span>Nosotros</span>
            <span>Contacto</span>
            <span className={`rounded-full px-[15px] py-2 text-white ${DEMO_GREEN}`}>Ingresar</span>
          </div>
        )}
      </div>

      <div
        className={`relative flex flex-col bg-[#e9f6f1] ${compact ? "gap-[9px] px-3.5 pb-[22px] pt-[18px]" : "gap-4 px-7 pb-12 pt-10"}`}
      >
        <span
          className={`self-start rounded-full bg-white font-bold text-[#135c45] ${
            compact ? "px-2 py-[3px] text-[9.5px]" : "px-3 py-[5px] text-[12px]"
          }`}
        >
          Inscripciones abiertas 2027
        </span>
        <span
          className={`font-extrabold tracking-[-0.02em] text-[#14213d] ${
            compact ? "max-w-[250px] text-[20px] leading-[1.1]" : "max-w-[440px] text-[35px] leading-[1.08]"
          }`}
        >
          Inglés para chicos, adolescentes y adultos.
        </span>
        {!compact && (
          <span className="max-w-[420px] text-[14px] leading-[1.55] text-[#4b5563]">
            Grupos reducidos, clases desde los 6 años y preparación para exámenes internacionales.
          </span>
        )}
        <div className={`flex ${compact ? "gap-1.5" : "gap-2.5"}`}>
          <span
            className={`rounded-full font-bold text-white ${DEMO_GREEN} ${compact ? "px-3 py-[7px] text-[10.5px]" : "px-[18px] py-[11px] text-[13px]"}`}
          >
            Pre-inscribite
          </span>
          <span
            className={`rounded-full bg-white font-bold text-[#14213d] ${compact ? "px-3 py-[7px] text-[10.5px]" : "px-[18px] py-[11px] text-[13px]"}`}
          >
            Ver cursos
          </span>
        </div>
        <span
          className={`absolute flex items-center justify-center rounded-full bg-[#25d366] text-white ${
            compact ? "bottom-3 right-3 h-8 w-8" : "bottom-[22px] right-6 h-[46px] w-[46px] shadow-[0_10px_24px_rgba(37,211,102,0.4)]"
          }`}
        >
          <MessageCircle size={compact ? 16 : 22} strokeWidth={2} />
        </span>
      </div>
    </div>
  );
}

function LoginCard({ compact }: { compact: boolean }) {
  const label = compact ? "text-[9.5px]" : "text-[11px]";
  const field = compact ? "h-[30px] rounded-[10px] px-2.5" : "h-[38px] rounded-xl px-[13px]";
  return (
    <div
      className={`flex flex-col bg-white ${
        compact
          ? "gap-[9px] rounded-[20px] p-[15px] shadow-[0_22px_54px_rgba(31,26,61,0.18)]"
          : "gap-3 rounded-[24px] p-[22px] shadow-[0_26px_64px_rgba(31,26,61,0.18)]"
      }`}
    >
      <div className={`flex items-center ${compact ? "gap-2" : "gap-2.5"}`}>
        <DemoTile className={compact ? "h-7 w-7 rounded-[9px] text-[13px]" : "h-9 w-9 rounded-[11px] text-[16px]"} />
        <div className="flex flex-col gap-px">
          <span className={`font-display font-extrabold text-lc-ink ${compact ? "text-[12.5px]" : "text-[15px]"}`}>
            Instituto Demo
          </span>
          <span className={`text-lc-subtle ${compact ? "text-[10px]" : "text-[11.5px]"}`}>Ingresá al campus</span>
        </div>
      </div>
      <div className="flex flex-col gap-1 lg:gap-[5px]">
        <span className={`font-bold text-lc-body ${label}`}>Email o DNI</span>
        <span className={`flex items-center bg-[#f6f3ee] text-lc-ink ${field} ${compact ? "text-[11px]" : "text-[13px]"}`}>
          45.123.456
        </span>
      </div>
      <div className="flex flex-col gap-1 lg:gap-[5px]">
        <span className={`font-bold text-lc-body ${label}`}>Contraseña</span>
        <span
          className={`flex items-center bg-[#f6f3ee] text-lc-ink ${field} ${
            compact ? "text-[12px] tracking-[2px]" : "text-[14px] tracking-[3px]"
          }`}
        >
          ••••••••
        </span>
      </div>
      <span
        className={`flex items-center justify-center rounded-full font-bold text-white ${DEMO_GREEN} ${
          compact ? "h-8 text-[11.5px]" : "h-[42px] text-[13.5px]"
        }`}
      >
        Ingresar
      </span>
    </div>
  );
}

function HomeScreen({ compact }: { compact: boolean }) {
  const blanks = compact ? [0, 1, 2, 3, 4, 5, 6, 7, 8] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const appIndex = compact ? 4 : 5;
  const blank = compact ? "h-[30px] w-[30px] rounded-[10px]" : "h-[38px] w-[38px] rounded-[13px]";
  return (
    <div
      className={`grid h-full w-full bg-[linear-gradient(165deg,#ffd8c4,#ece9ff_55%,#dcebff)] ${
        compact
          ? "auto-rows-[54px] grid-cols-3 gap-2 rounded-[24px] px-3 pb-3 pt-[26px]"
          : "auto-rows-[66px] grid-cols-4 gap-2.5 rounded-[32px] px-[18px] pb-[18px] pt-9"
      }`}
    >
      {blanks.map((index) =>
        index === appIndex ? (
          <div key={index} className="flex flex-col items-center gap-1 lg:gap-[5px]">
            <DemoTile
              className={`shadow-[0_0_0_3px_#ffffff,0_10px_22px_rgba(31,26,61,0.30)] ${
                compact ? "h-[34px] w-[34px] rounded-[11px] text-[15px]" : "h-[42px] w-[42px] rounded-[13px] text-[18px]"
              }`}
            />
            <span className={`font-bold text-lc-ink ${compact ? "text-[8.5px]" : "text-[9.5px]"}`}>Inst. Demo</span>
          </div>
        ) : (
          <span key={index} className={`justify-self-center bg-white/55 ${blank}`} />
        ),
      )}
    </div>
  );
}

function BrandArtMobile() {
  return (
    <div aria-hidden="true" className="relative h-[600px] lg:hidden">
      <div className="absolute left-1/2 top-0 h-full w-[350px] -translate-x-1/2">
        <div className="absolute left-5 top-[110px] h-[330px] w-[330px] rounded-full bg-[#eef5ff]" />
        <Sparkle className="absolute left-[318px] top-0 h-[30px] w-[30px]" />
        <div className="absolute left-0 top-5 w-[350px]">
          <BrowserWindow compact />
        </div>
        <div className="absolute left-1 top-[300px] w-[196px] rotate-[-3deg]">
          <LoginCard compact />
        </div>
        <div className="absolute left-[196px] top-[272px] h-[318px] w-40 rotate-[4deg] rounded-[30px] bg-lc-ink p-1.5 shadow-[0_26px_60px_rgba(31,26,61,0.30)]">
          <HomeScreen compact />
        </div>
      </div>
    </div>
  );
}

function BrandArtDesktop() {
  return (
    <div
      aria-hidden="true"
      className="relative hidden h-[720px] w-[700px] shrink-0 lg:block lg:[zoom:0.6] xl:[zoom:0.77] min-[1440px]:[zoom:1]"
    >
      <div className="absolute left-[90px] top-[110px] h-[560px] w-[560px] rounded-full bg-[#eef5ff]" />
      <Sparkle className="absolute left-[640px] top-10 h-10 w-10" />
      <div className="absolute left-0 top-10 w-[640px]">
        <BrowserWindow compact={false} />
      </div>
      <div className="absolute left-10 top-[440px] w-[282px] rotate-[-3deg]">
        <LoginCard compact={false} />
      </div>
      <div className="absolute left-[468px] top-[262px] h-[452px] w-[232px] rotate-[4deg] rounded-[40px] bg-lc-ink p-2 shadow-[0_34px_80px_rgba(31,26,61,0.30)]">
        <HomeScreen compact={false} />
      </div>
    </div>
  );
}
