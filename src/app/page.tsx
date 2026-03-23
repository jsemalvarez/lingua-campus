import { headers } from "next/headers";
import { cache } from "react";
import type { Metadata } from 'next';
import prisma from "@/lib/prisma";
import LinguaCampusLanding from "@/components/landing/LinguaCampusLanding";
import InstituteLanding from "@/components/landing/InstituteLanding";

// Usamos cache de React para que no se ejecute dos veces en la misma request (una por generateMetadata y otra por IndexPage)
const getTenantByHost = cache(async (host: string, previewTenantId?: string) => {
  if (previewTenantId) {
    return prisma.institute.findUnique({
      where: { id: previewTenantId },
    });
  }

  const cleanHost = host.split(":")[0]; 
  const hostWithoutWww = cleanHost.replace(/^www\./, '');
  
  if (hostWithoutWww === "lingua-campus.com.ar" || hostWithoutWww === "localhost" || hostWithoutWww === "lingua-campus.vercel.app") {
    return null;
  }

  let subdomainMatch = null;
  if (hostWithoutWww.endsWith(".lingua-campus.com.ar")) {
    subdomainMatch = hostWithoutWww.replace(".lingua-campus.com.ar", "");
  } else if (hostWithoutWww.endsWith(".localhost")) {
    subdomainMatch = hostWithoutWww.replace(".localhost", "");
  } else if (hostWithoutWww.endsWith(".vercel.app")) {
    subdomainMatch = hostWithoutWww.replace(".vercel.app", "");
  }

  return prisma.institute.findFirst({
    where: {
      OR: [
        { customDomain: cleanHost },
        { customDomain: hostWithoutWww },
        { subdomain: cleanHost }, 
        ...(subdomainMatch && subdomainMatch !== "" ? [{ subdomain: subdomainMatch }] : [])
      ]
    }
  });
});

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
      title: `${institute.name} | Campus Virtual`,
      description: institute.description || `Plataforma educativa y campus virtual de ${institute.name}.`,
      icons: {
        icon: institute.logoUrl || fallbackIcon,
        shortcut: institute.pwaIcon192 || institute.logoUrl || fallbackIcon,
        apple: institute.pwaIcon512 || institute.pwaIcon192 || institute.logoUrl || fallbackIcon,
      }
    };
  }

  return {
    title: "Lingua Campus — Gestión Administrativa",
    description: "Plataforma de multi-tenant gestión para institutos de idiomas.",
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
