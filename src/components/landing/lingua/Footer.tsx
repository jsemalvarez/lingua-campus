import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Instagram, Mail, MapPin, MessageCircle } from "lucide-react";
import { LogoMark } from "./LogoMark";
import { CONTACT_EMAIL, INSTAGRAM_URL, WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from "./ui";

// Pie de página. Cierra con el nombre en letra gigante, recortado por el borde de abajo.

const PRODUCT = [
  { href: "#como-funciona", label: "Práctica con IA" },
  { href: "#gestion", label: "Gestión" },
  { href: "#familias", label: "Familias" },
  { href: "#tu-marca", label: "Tu marca" },
];

const PLANS = [
  { href: "#precios", label: "Precios" },
  { href: "#fundadores", label: "Fundadores" },
  { href: "#preguntas", label: "Preguntas frecuentes" },
];

const HEADING = "mb-1 text-[12.5px] font-extrabold uppercase tracking-[0.08em] text-lc-subtle lg:mb-0";
const LINK = "py-2.5 text-[15.5px] text-lc-body transition-colors hover:text-lc-violet-deep lg:py-0";

export function Footer() {
  return (
    <footer className="lc-clip relative bg-lc-cream text-lc-ink">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-34px] left-1/2 flex -translate-x-1/2 flex-col items-center whitespace-nowrap font-display text-[96px] font-extrabold leading-[0.88] tracking-[-0.045em] text-[#f3e2c7] lg:bottom-[-80px] lg:flex-row lg:gap-[0.25em] lg:text-[200px] lg:leading-none"
      >
        <span>Lingua</span>
        <span>Campus</span>
      </div>

      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col px-5 pb-[210px] pt-14 lg:px-20 lg:pb-[190px] lg:pt-20">
        {/* Contacto nunca baja de 17rem: es lo que ocupa el correo. Entre 1024 y 1280 la marca va
            arriba y las tres columnas abajo; desde 1280, las cuatro en una fila. */}
        <div className="flex flex-col gap-9 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(17rem,1fr)] lg:gap-12 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(17rem,1fr)]">
          <div className="flex flex-col gap-4 lg:col-span-3 lg:gap-[18px] xl:col-span-1">
            <a href="#inicio" className="flex items-center gap-[11px] self-start text-lc-ink lg:gap-3">
              <LogoMark size={42} className="lg:h-[46px] lg:w-[46px]" />
              <span className="font-display text-[23px] font-extrabold tracking-[-0.035em] lg:text-[25px]">
                Lingua Campus
              </span>
            </a>
            <p className="m-0 max-w-[320px] text-pretty text-[15.5px] leading-[1.55] text-lc-text lg:text-[16px]">
              Práctica con IA y gestión para institutos de idiomas.
            </p>
            <Link
              href="/login"
              className="mt-0.5 flex h-12 items-center gap-2 self-start rounded-full border-[1.5px] border-lc-ink px-5 text-[15px] font-bold text-lc-ink transition-colors hover:bg-lc-ink hover:text-white lg:mt-0 lg:h-[46px]"
            >
              Acceder al campus <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:contents">
            <nav aria-label="Producto" className="flex flex-col lg:gap-3.5">
              <span className={HEADING}>Producto</span>
              {PRODUCT.map((link) => (
                <a key={link.href} href={link.href} className={LINK}>
                  {link.label}
                </a>
              ))}
            </nav>
            <nav aria-label="Planes" className="flex flex-col lg:gap-3.5">
              <span className={HEADING}>Planes</span>
              {PLANS.map((link) => (
                <a key={link.href} href={link.href} className={LINK}>
                  {link.label}
                </a>
              ))}
            </nav>
          </div>

          <div className="flex flex-col lg:gap-3.5">
            <span className={HEADING}>Contacto</span>
            <ContactLink href={`https://wa.me/${WHATSAPP_NUMBER}`} external icon={<MessageCircle size={17} strokeWidth={2.2} className="text-lc-green-deep" />}>
              {WHATSAPP_DISPLAY}
            </ContactLink>
            <ContactLink href={`mailto:${CONTACT_EMAIL}`} icon={<Mail size={17} strokeWidth={2} className="text-lc-violet-deep" />}>
              {CONTACT_EMAIL}
            </ContactLink>
            <ContactLink href={INSTAGRAM_URL} external icon={<Instagram size={17} strokeWidth={2} className="text-lc-coral-deep" />}>
              @somoslinguacampus
            </ContactLink>
            <span className="flex items-center gap-2 py-2.5 text-[15.5px] text-lc-body lg:py-0">
              <MapPin size={17} strokeWidth={2} className="shrink-0 text-lc-subtle" aria-hidden="true" />
              Mar del Plata, Argentina
            </span>
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-2 border-t-[1.5px] border-[#ecdfca] pt-5 text-[13.5px] leading-normal text-lc-subtle lg:mt-14 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:pt-[22px] lg:text-[14px]">
          <span>© 2026 Lingua Campus. Todos los derechos reservados.</span>
          <span>
            Desarrollado y potenciado por{" "}
            <a
              href="https://origenmdp.vercel.app/"
              target="_blank"
              rel="noopener noreferrer"
              className="whitespace-nowrap font-bold text-lc-violet-deep hover:underline"
            >
              Origen MdP - Costa Tech
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}

function ContactLink({
  href,
  external,
  icon,
  children,
}: {
  href: string;
  external?: boolean;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className="flex items-center gap-2 self-start py-2.5 text-[15.5px] text-lc-body transition-colors hover:text-lc-violet-deep lg:py-0"
    >
      <span aria-hidden="true" className="shrink-0">
        {icon}
      </span>
      {children}
    </a>
  );
}
