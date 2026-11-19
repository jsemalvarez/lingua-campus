"use client";

import { SectionError } from "@/components/ui/SectionError";

// El registro lo hace `SectionError` (ARQ-09), igual que en las demás pantallas de error.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <SectionError
        title="Oops! Algo salió muy mal"
        message="La aplicación encontró un error crítico. Estamos trabajando para solucionarlo."
        error={error}
        reset={reset}
      />
    </div>
  );
}
