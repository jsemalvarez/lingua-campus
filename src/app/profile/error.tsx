"use client";

import { SectionError } from "@/components/ui/SectionError";

export default function ProfileError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <SectionError 
      title="Error en Perfil"
      message="No pudimos cargar tus datos de usuario. Por favor, reintenta."
      error={error}
      reset={reset}
    />
  );
}
