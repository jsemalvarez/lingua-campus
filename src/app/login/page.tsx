import { headers } from "next/headers";
import { getTenantByHost } from "@/lib/tenant";
import LoginForm from "./LoginForm";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  
  const institute = await getTenantByHost(host);

  if (institute) {
    const primaryColorHex = "4F46E5";
    const initial = institute.name.charAt(0).toUpperCase();
    const fallbackIcon = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="20" fill="%23${primaryColorHex}" /><text x="50" y="50" font-family="system-ui, sans-serif" font-size="55" font-weight="bold" fill="white" dominant-baseline="central" text-anchor="middle">${initial}</text></svg>`;

    return {
      title: `Iniciar Sesión | ${institute.name}`,
      description: `Acceso al campus virtual de ${institute.name}.`,
      icons: {
        icon: institute.logoUrl || fallbackIcon,
        shortcut: institute.pwaIcon192 || institute.logoUrl || fallbackIcon,
        apple: institute.pwaIcon512 || institute.pwaIcon192 || institute.logoUrl || fallbackIcon,
      }
    };
  }

  return {
    title: "Iniciar Sesión | Lingua Campus",
    description: "Ingresá a tu cuenta de Lingua Campus",
  };
}

export default async function LoginPage() {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  
  const institute = await getTenantByHost(host);

  return <LoginForm institute={institute} />;
}
