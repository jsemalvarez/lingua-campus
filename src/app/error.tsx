"use client";

import { SectionError } from "@/components/ui/SectionError";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error Boundary:", error);
  }, [error]);

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
