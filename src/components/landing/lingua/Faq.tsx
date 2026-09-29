import { Section, Tag, Underlined } from "./ui";

// Preguntas frecuentes. En el celular, «¿Te quedó otra duda?» va al final, como puente a
// Contacto; en escritorio, al lado del título.

const QUESTIONS = [
  {
    q: "¿Tengo que cargar todos mis datos de nuevo?",
    a: "No. Migramos tus alumnos, cursos y cuotas sin costo, a partir de tus planillas.",
  },
  {
    q: "¿Cuánto cuesta?",
    // Espacio duro después del «$», para que no quede solo al final de un renglón.
    a: "Cada módulo cuesta $ 800 por alumno que cursa, por mes, más una cuota base de $ 30.000. Con dos módulos, $ 1.400 por alumno; con los cuatro, $ 2.600 y sin cuota base.",
  },
  {
    q: "¿La IA reemplaza al docente?",
    a: "No. La IA arma una propuesta de práctica con el tema de la clase; el docente la revisa, la cambia si quiere y decide cuándo publicarla.",
  },
  {
    q: "¿La práctica corrige la pronunciación?",
    a: "Trabaja la producción oral: el alumno dice en voz alta las frases de la clase y ve cuáles se entendieron bien. No reemplaza la corrección del docente.",
  },
  {
    q: "¿Mis docentes van a saber usarlo?",
    a: "Tenés soporte técnico desde el primer día. Y los institutos fundadores suman una capacitación en IA pensada para docentes de idiomas.",
  },
  {
    q: "¿Hay que instalar algo?",
    a: "No. Funciona en el navegador de cualquier computadora o celular, y las familias pueden instalarlo como app sin pasar por ninguna tienda.",
  },
  {
    q: "¿Y los alumnos que no tienen email?",
    a: "Entran con su DNI. Está pensado para los más chicos, que muchas veces no tienen un correo propio.",
  },
  {
    q: "¿Sirve para otros idiomas?",
    a: "La gestión, el portal de las familias y tu marca sirven para cualquier idioma. La práctica con IA, hoy, está hecha para inglés.",
  },
];

function AnotherQuestion({ className }: { className: string }) {
  return (
    <p className={`m-0 text-[16.5px] leading-[1.55] text-lc-text lg:text-[17px] ${className}`}>
      ¿Te quedó otra duda?{" "}
      <a href="#contacto" className="border-b-[3px] border-lc-yellow font-bold text-lc-violet-deep">
        Escribinos
      </a>{" "}
      y te respondemos.
    </p>
  );
}

export function Faq() {
  return (
    <Section id="preguntas" className="bg-lc-cream text-lc-ink">
      <div className="flex flex-col gap-7 pb-16 pt-[72px] lg:gap-[52px] lg:pb-[104px] lg:pt-28">
        <div className="flex items-end justify-between gap-12">
          <header className="flex max-w-[720px] flex-col gap-4 lg:gap-[18px]">
            <Tag tone="violet">Preguntas frecuentes</Tag>
            <h2 className="m-0 text-balance font-display text-[38px] font-extrabold leading-[1.03] tracking-[-0.035em] lg:text-[52px] lg:leading-[1.02]">
              Antes de que lo <Underlined>preguntes.</Underlined>
            </h2>
          </header>
          <AnotherQuestion className="hidden max-w-[360px] lg:block" />
        </div>

        <div className="flex flex-col gap-3 lg:grid lg:grid-cols-2 lg:gap-x-5 lg:gap-y-[18px]">
          {QUESTIONS.map((item) => (
            <div
              key={item.q}
              className="flex flex-col gap-2 rounded-[22px] bg-white p-5 shadow-[0_1px_2px_rgba(31,26,61,0.05)] lg:gap-[9px] lg:rounded-[24px] lg:px-[26px] lg:py-6"
            >
              <h3 className="m-0 font-display text-[18.5px] font-bold leading-[1.25] tracking-[-0.015em] lg:text-[20px]">
                {item.q}
              </h3>
              <p className="m-0 text-[15px] leading-[1.55] text-lc-text lg:text-[15.5px]">{item.a}</p>
            </div>
          ))}
        </div>

        <AnotherQuestion className="text-balance text-center lg:hidden" />
      </div>
    </Section>
  );
}
