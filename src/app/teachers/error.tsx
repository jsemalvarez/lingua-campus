"use client";

import { SectionError } from "@/components/ui/SectionError";

export default function TeachersError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SectionError 
      title="Error en Profesores"
      message="No pudimos cargar la lista del personal docente. Por favor, reintenta."
      error={error}
      reset={reset}
    />
  );
}
