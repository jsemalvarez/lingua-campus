"use client";

import { SectionError } from "@/components/ui/SectionError";

export default function InscriptionError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <SectionError 
        title="Formulario no disponible"
        message="Lo sentimos, el formulario de inscripción encontró un problema técnico. Por favor, intenta más tarde o contacta al instituto."
        error={error}
        reset={reset}
        showHome={false}
      />
    </div>
  );
}
