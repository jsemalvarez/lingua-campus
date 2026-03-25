"use client";

import { SectionError } from "@/components/ui/SectionError";

export default function ScheduleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SectionError 
      title="Error en Calendario"
      message="No pudimos cargar los horarios de clase. Por favor, reintenta."
      error={error}
      reset={reset}
    />
  );
}
