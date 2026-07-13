"use client";

import { useEffect, useState, useCallback } from "react";

// Extiende el tipo de BeforeInstallPromptEvent que no está en el estándar de TypeScript
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISSED_KEY = "pwa_install_dismissed_until";

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    // Verifica si ya está instalada como app standalone
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        (navigator as { standalone?: boolean }).standalone === true);

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Detecta si es un dispositivo móvil (ignorar desktop)
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    if (!isMobile) {
      return;
    }

    // Verifica si el usuario ya rechazó recientemente al montar
    const dismissedUntil = localStorage.getItem(DISMISSED_KEY);
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil)) {
      return;
    }

    // Detecta iOS Safari
    const isIOSDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as { MSStream?: unknown }).MSStream;
    const isSafari =
      /Safari/.test(navigator.userAgent) &&
      !/Chrome|CriOS|FxiOS/.test(navigator.userAgent);

    if (isIOSDevice && isSafari) {
      setIsIOS(true);
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android / Chrome: espera el evento beforeinstallprompt
    let bannerTimer: ReturnType<typeof setTimeout>;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault(); // Suprime el mini-infobar automático de Chrome
      
      // Verifica de nuevo por si se rechazó recientemente pero el listener sigue activo
      const currentDismissedUntil = localStorage.getItem(DISMISSED_KEY);
      if (currentDismissedUntil && Date.now() < parseInt(currentDismissedUntil)) {
        return;
      }

      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Limpia cualquier timer previo por si el evento se dispara múltiples veces
      if (bannerTimer) clearTimeout(bannerTimer);
      
      // Muestra el banner después de 3 segundos
      bannerTimer = setTimeout(() => setShowBanner(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Detecta cuando la app se instala exitosamente
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      if (bannerTimer) clearTimeout(bannerTimer);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Dispara el Richer Install UI nativo de Chrome
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "dismissed") {
      localStorage.setItem(
        DISMISSED_KEY,
        String(Date.now() + 1 * 24 * 60 * 60 * 1000) // 1 día (24 horas)
      );
    }

    setDeferredPrompt(null);
    setShowBanner(false);
  }, [deferredPrompt]);

  // Cierra el banner y no vuelve a mostrar por 1 día (24 horas)
  const dismissBanner = useCallback(() => {
    setShowBanner(false);
    localStorage.setItem(
      DISMISSED_KEY,
      String(Date.now() + 1 * 24 * 60 * 60 * 1000) // 1 día (24 horas)
    );
  }, []);

  return {
    /** true si el evento beforeinstallprompt está listo (Android Chrome) */
    canInstall: !!deferredPrompt,
    /** true si el dispositivo es iOS/Safari */
    isIOS,
    /** true si la app ya está instalada en modo standalone */
    isInstalled,
    /** true cuando se debe mostrar el banner */
    showBanner,
    /** Llama al Richer Install UI nativo de Chrome */
    promptInstall,
    /** Cierra el banner (recuerda la decisión) */
    dismissBanner,
  };
}
