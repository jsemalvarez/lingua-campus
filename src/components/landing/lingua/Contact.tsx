import { Mail, MapPin, MessageCircle } from "lucide-react";
import { ContactForm } from "./ContactForm";
import { CONTACT_EMAIL, Section, Tag, Underlined, WHATSAPP_DISPLAY, WHATSAPP_NUMBER } from "./ui";

// Contacto: WhatsApp como botón principal y el formulario como alternativa (27/09/2026).

const WHATSAPP_MESSAGE = "Hola, quiero saber más de Lingua Campus para mi instituto.";
const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

export function Contact() {
  return (
    <Section id="contacto" className="bg-lc-ink text-white">
      <div aria-hidden="true" className="absolute left-[230px] top-[-100px] h-[300px] w-[300px] rounded-full bg-[rgba(75,62,240,0.28)] lg:left-[1120px] lg:top-[-140px] lg:h-[480px] lg:w-[480px]" />
      <div aria-hidden="true" className="absolute left-[-170px] top-[420px] h-[380px] w-[380px] rounded-full bg-[rgba(37,211,102,0.08)] lg:left-[-160px] lg:top-[560px] lg:h-[540px] lg:w-[540px]" />

      <div className="relative flex flex-col gap-5 pb-16 pt-[72px] lg:gap-11 lg:pb-[104px] lg:pt-28">
        <header className="mb-2 flex max-w-[760px] flex-col gap-4 lg:mb-0 lg:gap-[18px]">
          <Tag tone="green">Contacto</Tag>
          <h2 className="m-0 text-balance font-display text-[38px] font-extrabold leading-[1.03] tracking-[-0.035em] lg:text-[56px] lg:leading-[1.02]">
            Hablemos de tu <Underlined>instituto.</Underlined>
          </h2>
          <p className="m-0 max-w-[700px] text-pretty text-[16.5px] leading-[1.55] text-lc-lavender lg:text-[19px] lg:leading-[1.6]">
            Contanos cómo es tu instituto y te mostramos el campus en funcionamiento. Elegí por dónde te queda más
            cómodo.
          </p>
        </header>

        <div className="flex flex-col gap-5 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-stretch lg:gap-6">
          <div className="flex flex-col gap-4 rounded-[24px] border-[1.5px] border-white/10 bg-white/[0.06] p-5 lg:gap-5 lg:rounded-[28px] lg:p-8">
            <span className="self-start rounded-full bg-[rgba(37,211,102,0.16)] px-[11px] py-[5px] text-[12.5px] font-extrabold text-[#7ee2a8] lg:px-3 lg:text-[13px]">
              La forma más rápida
            </span>
            <h3 className="m-0 font-display text-[24px] font-extrabold leading-[1.15] tracking-[-0.02em] lg:text-[30px] lg:leading-[1.1]">
              Escribinos por WhatsApp
            </h3>

            {/* Entre 1024 y 1280 el formulario va en una columna y es más alto: el chat se estira y
                el mensaje queda abajo, como en un chat de verdad. */}
            <div
              aria-hidden="true"
              className="flex flex-col gap-2.5 rounded-[18px] bg-black/[0.22] p-3.5 lg:flex-1 lg:gap-3 lg:rounded-[20px] lg:p-4 xl:flex-none"
            >
              <div className="flex items-center gap-[11px] lg:gap-3">
                <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-[#25d366] text-[#0b2e1f] lg:h-[38px] lg:w-[38px]">
                  <MessageCircle size={18} strokeWidth={2.2} />
                </span>
                <div className="flex flex-col gap-px">
                  <span className="text-[14.5px] font-bold text-white lg:text-[15px]">Lingua Campus</span>
                  <span className="text-[12px] text-lc-mist lg:text-[12.5px]">Chat de WhatsApp</span>
                </div>
              </div>
              <span className="max-w-[88%] self-end rounded-[16px_16px_5px_16px] bg-lc-green-soft px-[13px] py-[11px] text-[15px] leading-[1.45] text-[#13382a] lg:mt-auto lg:max-w-[82%] xl:mt-0 lg:rounded-[18px_18px_6px_18px] lg:px-3.5 lg:py-3 lg:text-[15.5px]">
                {WHATSAPP_MESSAGE}
              </span>
              <span className="self-end text-[12.5px] text-lc-mist lg:text-[13px]">
                El mensaje ya va escrito: solo tocás Enviar.
              </span>
            </div>

            <a
              href={WHATSAPP_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-14 items-center justify-center gap-[11px] rounded-full bg-[#25d366] text-[17px] font-extrabold text-[#0b2e1f] shadow-[0_14px_30px_rgba(37,211,102,0.22)] transition-colors hover:bg-[#3ee07a] lg:mt-auto lg:h-[60px] lg:gap-3 lg:text-[18px]"
            >
              <MessageCircle size={21} strokeWidth={2.3} aria-hidden="true" />
              Abrir WhatsApp
            </a>
            <span className="text-center text-[14.5px] text-lc-lavender lg:text-[15px]">
              WhatsApp: <strong className="font-bold text-white">{WHATSAPP_DISPLAY}</strong>
            </span>
          </div>

          <ContactForm />
        </div>

        <div className="mt-1 flex flex-col gap-2.5 text-[14.5px] leading-[1.45] text-lc-mist lg:mt-0 lg:flex-row lg:items-center lg:gap-7 lg:text-[15px]">
          <span className="flex items-center gap-2">
            <Mail size={18} strokeWidth={2} className="shrink-0" aria-hidden="true" />
            <span>
              También por correo:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className="border-b-2 border-lc-yellow font-bold text-white">
                {CONTACT_EMAIL}
              </a>
            </span>
          </span>
          <span className="flex items-center gap-2">
            <MapPin size={18} strokeWidth={2} className="shrink-0" aria-hidden="true" />
            Mar del Plata, Argentina
          </span>
        </div>
      </div>
    </Section>
  );
}
