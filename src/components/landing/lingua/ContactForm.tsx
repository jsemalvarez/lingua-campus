"use client";

import { useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";

// Formulario de Contacto: la alternativa a WhatsApp. Lo manda FormSubmit al correo del
// proyecto. En lugar del correo va el alias que FormSubmit dio al activarlo, así la
// dirección no queda a la vista en el pedido.

const ENDPOINT = "https://formsubmit.co/ajax/19f014da3abd7885fa79883150d78527";

type Status = "idle" | "sending" | "sent" | "error";

const FIELD =
  "box-border h-[50px] w-full rounded-[14px] border-[1.5px] border-[#e6e1f2] bg-[#fbf8f3] px-4 text-[16px] text-lc-ink placeholder:text-lc-subtle focus:border-lc-violet focus:outline-none lg:text-[15px]";
const LABEL = "text-[13px] font-bold text-lc-body";

export function ContactForm() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setStatus("sending");

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          Nombre: data.get("nombre"),
          Instituto: data.get("instituto"),
          Correo: data.get("correo"),
          "Alumnos que cursan": data.get("alumnos") || "—",
          Mensaje: data.get("mensaje") || "—",
          _replyto: data.get("correo"),
          _subject: "Nueva consulta desde la web de Lingua Campus",
          _template: "table",
          _honey: data.get("_honey"),
        }),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || String(result?.success) === "false") throw new Error("No se pudo enviar");
      form.reset();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="m-0 flex flex-col gap-[18px] rounded-[24px] bg-white px-5 py-[22px] text-lc-ink lg:gap-5 lg:rounded-[28px] lg:p-8"
    >
      <div className="flex flex-col gap-1.5">
        <h3 className="m-0 font-display text-[22px] font-extrabold leading-[1.15] tracking-[-0.02em] lg:text-[26px]">
          ¿Preferís dejarnos tus datos?
        </h3>
        <p className="m-0 text-[14.5px] leading-normal text-lc-subtle lg:text-[15px]">
          Completalo y te escribimos nosotros.
        </p>
      </div>

      {/* Dos columnas recién desde 1280: a 1024 no entran los textos de ejemplo ni la etiqueta de alumnos. */}
      <div className="flex flex-col gap-3.5 xl:grid xl:grid-cols-2 xl:gap-x-4 xl:gap-y-3.5">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lc-nombre" className={LABEL}>
            Tu nombre
          </label>
          <input id="lc-nombre" name="nombre" type="text" required autoComplete="name" placeholder="Nombre y apellido" className={FIELD} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lc-instituto" className={LABEL}>
            Instituto
          </label>
          <input
            id="lc-instituto"
            name="instituto"
            type="text"
            required
            autoComplete="organization"
            placeholder="Nombre del instituto"
            className={FIELD}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lc-correo" className={LABEL}>
            Correo
          </label>
          <input
            id="lc-correo"
            name="correo"
            type="email"
            required
            autoComplete="email"
            placeholder="nombre@instituto.com"
            className={FIELD}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="lc-alumnos-contacto" className={LABEL}>
            Alumnos que cursan <span className="font-medium text-lc-subtle">(opcional)</span>
          </label>
          <input
            id="lc-alumnos-contacto"
            name="alumnos"
            type="number"
            min={0}
            inputMode="numeric"
            placeholder="Ej.: 150"
            className={FIELD}
          />
        </div>
        <div className="flex flex-col gap-1.5 xl:col-span-2">
          <label htmlFor="lc-mensaje" className={LABEL}>
            Mensaje <span className="font-medium text-lc-subtle">(opcional)</span>
          </label>
          <textarea
            id="lc-mensaje"
            name="mensaje"
            rows={3}
            placeholder="Contanos qué te gustaría saber"
            className={`${FIELD} h-24 resize-none py-[13px] leading-[1.45] lg:h-[92px]`}
          />
        </div>
      </div>

      {/* Campo trampa para robots: una persona no lo ve ni lo completa. */}
      <input type="text" name="_honey" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />

      {status === "sent" && (
        <p role="status" className="m-0 rounded-[14px] bg-lc-green-soft px-3.5 py-2.5 text-[14.5px] font-semibold text-lc-green-deep">
          Listo, recibimos tus datos. Te escribimos pronto.
        </p>
      )}
      {status === "error" && (
        <p role="alert" className="m-0 rounded-[14px] bg-lc-coral-soft px-3.5 py-2.5 text-[14.5px] font-semibold text-lc-coral-deep">
          No pudimos enviar el mensaje. Probá de nuevo o escribinos por WhatsApp.
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="flex h-[54px] cursor-pointer items-center justify-center gap-2.5 rounded-full border-0 bg-lc-violet text-[16.5px] font-extrabold text-white transition-colors hover:bg-lc-violet-deep disabled:cursor-wait disabled:opacity-70"
      >
        {status === "sending" ? "Enviando…" : "Enviar"}
        {status !== "sending" && <ArrowRight size={18} strokeWidth={2.4} aria-hidden="true" />}
      </button>
    </form>
  );
}
