"use client";

import { SectionError } from "@/components/ui/SectionError";

export default function PaymentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SectionError 
      title="Error en Pagos"
      message="No pudimos cargar el historial transaccional. Por favor, reintenta."
      error={error}
      reset={reset}
    />
  );
}
