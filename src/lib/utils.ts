import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names and handles tailwind conflicts correctly.
 * Use this in every component to combine dynamic and static classes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getMonthName = (month: number): string => {
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  return months[month - 1] || `Mes ${month}`;
};

export const formatFeeLabel = (type: string, month: number, year: number) => {
  if (type === "ENROLLMENT") return `Matrícula ${year}`;
  if (type === "EXAM") return `Derecho de Examen ${year}`;
  return `Cuota ${getMonthName(month)} ${year}`;
};
