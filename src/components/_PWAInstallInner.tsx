"use client";

// Importa el wrapper React que viene con el paquete
// (basado en @lit/react, compatible con React 18)
import PWAInstall from "@khmyznikov/pwa-install/dist/react-legacy/pwa-install.react-legacy.js";

export default function PWAInstallInner() {
  return (
    <PWAInstall
      manifestUrl="/manifest.json"
      installDescription="Instalá la app para acceso rápido sin el navegador"
      useLocalStorage
    />
  );
}
