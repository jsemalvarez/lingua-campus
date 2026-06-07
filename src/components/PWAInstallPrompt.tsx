"use client";

/**
 * PWAInstallPrompt — Wrapper del Web Component @khmyznikov/pwa-install
 *
 * Este componente renderiza el elemento <pwa-install> que gestiona
 * automáticamente el Richer Install UI del navegador:
 * - Intercepta beforeinstallprompt
 * - Muestra el bottom sheet nativo con screenshots del manifest
 * - Maneja iOS Safari con instrucciones paso a paso
 * - Recuerda si el usuario ya lo descartó (useLocalStorage)
 *
 * @see https://github.com/khmyznikov/pwa-install
 */

import dynamic from "next/dynamic";

// El Web Component usa APIs del navegador (window, navigator), por lo tanto
// debe renderizarse exclusivamente en el cliente, sin SSR.
const PWAInstallInner = dynamic(
  () => import("./_PWAInstallInner"),
  { ssr: false }
);

export function PWAInstallPrompt() {
  return <PWAInstallInner />;
}
