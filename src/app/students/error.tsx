"use client";

import { SectionError } from "@/components/ui/SectionError";

export default function StudentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SectionError 
      title="Error en Estudiantes"
      message="No pudimos cargar la lista de alumnos. Por favor, reintenta."
      error={error}
      reset={reset}
    />
  );
}
