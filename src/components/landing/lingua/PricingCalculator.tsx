"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { MAX_STUDENTS, MIN_MODULES, monthlyPrice, money } from "./prices";

// Calculadora de la sección Precios. Las reglas (tramos, mínimo de dos módulos y tope del
// tramo) están en `prices.ts`. No muestra el precio de fundador al lado: la comparación
// la hace el visitante, no la página.

const MODULES = [
  { id: "ped", name: "Pedagógico", on: "border-lc-coral-deep bg-lc-coral-soft text-lc-coral-deep" },
  { id: "ges", name: "Gestión", on: "border-lc-green-deep bg-lc-green-soft text-lc-green-deep" },
  { id: "mar", name: "Marca", on: "border-lc-sky-deep bg-lc-sky-soft text-lc-sky-deep" },
  { id: "app", name: "App", on: "border-lc-yellow-deep bg-lc-yellow-soft text-lc-yellow-deep" },
] as const;

type ModuleId = (typeof MODULES)[number]["id"];

export function PricingCalculator() {
  const [students, setStudents] = useState(100);
  const [selected, setSelected] = useState<Record<ModuleId, boolean>>({
    ped: true,
    ges: true,
    mar: true,
    app: true,
  });

  const count = MODULES.filter((module) => selected[module.id]).length;
  const enough = count >= MIN_MODULES;
  const price = monthlyPrice(students, count);
  const allFour = monthlyPrice(students, 4);

  return (
    <div className="flex flex-col gap-[22px] rounded-[28px] bg-white px-5 py-[22px] text-lc-ink lg:grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:gap-9 lg:rounded-[32px] lg:px-9 lg:py-8">
      <div className="flex flex-col gap-[22px] lg:gap-6">
        <div className="flex flex-col gap-1.5">
          <h3 className="m-0 font-display text-[24px] font-extrabold tracking-[-0.02em] lg:text-[27px]">
            Calculá cuánto pagarías
          </h3>
          <p className="m-0 text-[14.5px] leading-normal text-lc-subtle lg:text-[15px]">
            Desde dos módulos. El precio por alumno depende de cuántos alumnos cursan.
          </p>
        </div>

        <fieldset className="m-0 flex flex-col gap-2.5 border-0 p-0">
          <legend className="mb-2.5 p-0 text-[12.5px] font-extrabold uppercase tracking-[0.08em] text-lc-body">
            Módulos
          </legend>
          <div className="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
            {MODULES.map((module) => {
              const on = selected[module.id];
              return (
                <button
                  key={module.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setSelected((current) => ({ ...current, [module.id]: !current[module.id] }))}
                  className={`flex h-12 cursor-pointer items-center justify-center gap-[7px] rounded-full border-2 text-[15px] font-bold transition-colors lg:h-[50px] ${
                    on ? module.on : "border-[#e6e1f2] bg-white text-lc-subtle hover:border-[#d0c9e8]"
                  }`}
                >
                  {on && <Check size={15} strokeWidth={3} aria-hidden="true" />}
                  {module.name}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <label
              htmlFor="lc-alumnos"
              className="text-[12.5px] font-extrabold uppercase tracking-[0.08em] text-lc-body"
            >
              Alumnos que cursan
            </label>
            <span className="font-display text-[28px] font-extrabold tracking-[-0.02em] text-lc-violet-deep lg:text-[30px]">
              {students}
            </span>
          </div>
          <input
            id="lc-alumnos"
            type="range"
            min={10}
            max={MAX_STUDENTS}
            step={5}
            value={students}
            onChange={(event) => setStudents(Number(event.target.value))}
            className="m-0 h-[30px] w-full cursor-pointer accent-lc-violet"
          />
          <div className="flex justify-between text-[12.5px] text-lc-subtle">
            <span>10</span>
            <span>250</span>
            <span>500</span>
          </div>
        </div>
      </div>

      <div
        aria-live="polite"
        className="flex flex-col gap-2.5 rounded-[22px] bg-lc-cream px-5 py-[22px] lg:gap-3 lg:rounded-[24px] lg:p-[26px]"
      >
        <span className="text-[14px] font-bold text-lc-subtle">Pagarías por mes</span>
        <span className="font-display text-[46px] font-extrabold leading-none tracking-[-0.035em] text-lc-ink lg:text-[54px]">
          {enough ? money(price.total) : "—"}
        </span>
        {enough ? (
          <div className="flex flex-col gap-[5px] text-[14px] text-lc-body lg:text-[14.5px]">
            <span>
              {count} módulos: {money(price.perStudent)} × {students} alumnos
            </span>
            {price.cap !== null && <span>Tope del tramo: {money(price.cap)}</span>}
          </div>
        ) : (
          <span className="text-[13.5px] font-semibold leading-[1.45] text-lc-coral-deep lg:text-[14px]">
            Elegí al menos dos módulos.
          </span>
        )}
        {enough && count < 4 && (
          <span className="rounded-[14px] bg-lc-violet-soft px-3 py-[9px] text-[13.5px] font-semibold leading-[1.45] text-lc-violet-deep lg:text-[14px]">
            Con los cuatro módulos: {money(allFour.total)} por mes.
          </span>
        )}
      </div>
    </div>
  );
}
