import { headers } from "next/headers";
import { cache } from "react";
import type { Metadata } from 'next';
import prisma from "@/lib/prisma";
import LinguaCampusLanding from "@/components/landing/LinguaCampusLanding";
import InstituteLanding from "@/components/landing/InstituteLanding";

import { getTenantByHost } from "@/lib/tenant";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ preview_tenant?: string }>;
}): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const params = await searchParams;

  const institute = await getTenantByHost(host, params.preview_tenant);

  if (institute) {
    // Si no tienen logo, les generamos uno dinámico con SVG data URI (cuadrado redondeado con su inicial y color primario)
    const primaryColorHex = "4F46E5"; // Mismo color de InstituteLanding.tsx
    const initial = institute.name.charAt(0).toUpperCase();
    const fallbackIcon = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23${primaryColorHex}" /><text x="50" y="50" font-family="system-ui, sans-serif" font-size="55" font-weight="bold" fill="white" dominant-baseline="central" text-anchor="middle">${initial}</text></svg>`;

    return {
      title: `${institute.name} | Instituto de Inglés`,
      description: institute.description || `Instituto de inglés ${institute.name}. Cursos de inglés para todas las edades. Aprendé a hablar inglés fluido con nuestra academia.`,
      icons: {
        icon: institute.logoUrl || fallbackIcon,
        shortcut: institute.pwaIcon192 || institute.logoUrl || fallbackIcon,
        apple: institute.pwaIcon512 || institute.pwaIcon192 || institute.logoUrl || fallbackIcon,
      }
    };
  }

  return {
    // `absolute`: el título ya lleva la marca y no tiene que pasar por la plantilla del layout.
    title: { absolute: "Lingua Campus · Práctica con IA y gestión para institutos de inglés" },
    description:
      "Con el tema de cada clase, la IA arma la práctica de tus alumnos, y la administración del instituto está en el mismo sistema: cuotas, asistencia, boletines y el portal de las familias.",
  };
}

export default async function IndexPage({
  searchParams,
}: {
  searchParams: Promise<{ preview_tenant?: string }>;
}) {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const params = await searchParams;
  
  const institute = await getTenantByHost(host, params.preview_tenant);

  if (institute) {
    return <InstituteLanding institute={institute} />;
  }

  // Fallback to the main SaaS landing si no encontró el instituto
  return <LinguaCampusLanding />;
}
