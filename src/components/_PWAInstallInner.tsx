"use client";

import PWAInstall from "@khmyznikov/pwa-install/dist/react-legacy/pwa-install.react-legacy.js";
import { useTenant } from "@/components/providers/TenantProvider";

/**
 * Construye la URL del ícono desde Cloudinary si corresponde.
 * Misma lógica que manifest.ts para mantener consistencia.
 */
function buildCloudinaryIcon(logoUrl: string, size: number): string {
  return logoUrl.replace("/upload/", `/upload/c_fill,w_${size},h_${size},f_png/`);
}

export default function PWAInstallInner() {
  const tenant = useTenant();

  // Nombre de la app: usa el del instituto si está disponible
  const appName = tenant?.name ?? "Lingua Campus";

  // Ícono: si es Cloudinary lo transformamos, sino el ícono por defecto
  const appIcon =
    tenant?.logoUrl?.includes("res.cloudinary.com")
      ? buildCloudinaryIcon(tenant.logoUrl, 192)
      : "/icon-192x192.png";

  // Descripción corta que aparece debajo del nombre en el prompt
  const appDescription = "Gestión administrativa para institutos de idiomas";

  return (
    <PWAInstall
      manifestUrl="/manifest.json"
      name={appName}
      description={appDescription}
      icon={appIcon}
      installDescription="Instalá la app para acceso rápido sin el navegador"
      // Tint color para iOS (único estilo personalizable del componente)
      styles={{ "--tint-color": "#38b397" }}
      useLocalStorage
    />
  );
}
