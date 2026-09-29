"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { LogoMark } from "./LogoMark";

const LINKS = [
  { href: "#como-funciona", label: "Práctica con IA" },
  { href: "#gestion", label: "Gestión" },
  { href: "#familias", label: "Familias" },
  { href: "#precios", label: "Precios" },
];

export function Nav() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <nav aria-label="Principal" className="relative z-30">
      <div className="mx-auto flex h-[66px] w-full max-w-[1440px] items-center justify-between pl-5 pr-2.5 lg:h-[84px] lg:px-20">
        <a href="#inicio" className="flex items-center gap-2.5 text-lc-ink lg:gap-[11px]">
          <LogoMark size={36} className="lg:h-[42px] lg:w-[42px]" />
          <span className="font-display text-[20px] font-extrabold tracking-[-0.035em] lg:text-[22px]">
            Lingua Campus
          </span>
        </a>

        <div className="hidden items-center gap-6 text-[15.5px] font-medium lg:flex xl:gap-[34px]">
          {LINKS.map((link) => (
            <a key={link.href} href={link.href} className="text-lc-text transition-colors hover:text-lc-ink">
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-[22px] lg:flex">
          <Link href="/login" className="text-[15.5px] font-semibold text-lc-text transition-colors hover:text-lc-ink">
            Acceder
          </Link>
          <a
            href="#contacto"
            className="rounded-full bg-lc-ink px-5 py-3 text-[15px] font-bold text-white transition-colors hover:bg-[#2d2757]"
          >
            Pedí una demo
          </a>
        </div>

        <button
          type="button"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          aria-controls="lc-menu"
          onClick={() => setOpen((value) => !value)}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-lc-ink lg:hidden"
        >
          {open ? <X size={23} strokeWidth={2.2} /> : <Menu size={23} strokeWidth={2.2} />}
        </button>
      </div>

      {open && (
        <div
          id="lc-menu"
          className="absolute inset-x-3 top-[62px] rounded-[24px] bg-white p-3 shadow-[0_24px_60px_rgba(31,26,61,0.18)] lg:hidden"
        >
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={close}
              className="block rounded-2xl px-4 py-3 text-[16px] font-semibold text-lc-ink hover:bg-lc-cream"
            >
              {link.label}
            </a>
          ))}
          <div className="mt-2 flex flex-col gap-2 border-t border-[#efe6d8] pt-3">
            <Link
              href="/login"
              onClick={close}
              className="flex h-12 items-center justify-center rounded-full border-[1.5px] border-lc-ink text-[15px] font-bold text-lc-ink"
            >
              Acceder al campus
            </Link>
            <a
              href="#contacto"
              onClick={close}
              className="flex h-12 items-center justify-center rounded-full bg-lc-violet text-[15px] font-bold text-white"
            >
              Pedí una demo
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}
