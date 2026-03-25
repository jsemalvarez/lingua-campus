"use client";

import { SectionError } from "@/components/ui/SectionError";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SectionError 
      title="Error en el Dashboard"
      message="No pudimos cargar los indicadores del instituto. Por favor, reintenta."
      error={error}
      reset={reset}
    />
  );
}
