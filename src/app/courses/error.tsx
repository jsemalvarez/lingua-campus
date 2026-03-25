"use client";

import { SectionError } from "@/components/ui/SectionError";

export default function CoursesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SectionError 
      title="Error en Cursos"
      message="No pudimos cargar la oferta educativa. Por favor, reintenta."
      error={error}
      reset={reset}
    />
  );
}
