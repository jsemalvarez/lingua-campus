"use client";

import PWAInstall from "@khmyznikov/pwa-install/dist/react-legacy/pwa-install.react-legacy.js";
import { useTenant } from "@/components/providers/TenantProvider";

export default function PWAInstallInner() {
  const tenant = useTenant();

  const appName = tenant?.name ?? "Lingua Campus";

  const appIcon =
    tenant?.logoUrl?.includes("res.cloudinary.com")
      ? tenant.logoUrl.replace("/upload/", "/upload/c_fill,w_192,h_192,f_png/")
      : "/icon-192x192.png";

  return (
    <PWAInstall
      manifestUrl="/manifest.json"
      name={appName}
      description="Gestión administrativa para institutos de idiomas"
      icon={appIcon}
      installDescription="Instalá la app para acceso rápido sin el navegador"
      disableScreenshots
    />
  );
}
