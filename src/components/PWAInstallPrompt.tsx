"use client";

import { usePWAInstall } from "@/hooks/usePWAInstall";
import { useTenant } from "@/components/providers/TenantProvider";

// ── Android: banner que dispara el Richer Install UI nativo de Chrome ─────────

function AndroidInstallBanner({
  appName,
  appIcon,
  onInstall,
  onDismiss,
}: {
  appName: string;
  appIcon: string;
  onInstall: () => void;
  onDismiss: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-label={`Instalar ${appName}`}
      style={{
        position: "fixed",
        bottom: "80px", // encima de posibles barras de navegación inferior
        left: "12px",
        right: "12px",
        zIndex: 9999,
        background: "var(--background, #ffffff)",
        borderRadius: "16px",
        boxShadow:
          "0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(59,130,246,0.08)",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        animation: "pwa-slide-up 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        border: "1px solid var(--border, #e2e8f0)",
        color: "var(--foreground, #1e293b)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={appIcon}
          alt={appName}
          width={48}
          height={48}
          style={{ borderRadius: "12px", flexShrink: 0, objectFit: "cover" }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontWeight: 700,
              fontSize: "15px",
            }}
          >
            {appName}
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "12px",
              opacity: 0.7,
            }}
          >
            Agregá la app a tu pantalla de inicio
          </p>
        </div>
        <button
          onClick={onDismiss}
          aria-label="Cerrar"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "4px",
            color: "var(--muted-foreground, #64748b)",
            fontSize: "20px",
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>

      {/* Descripción */}
      <p
        style={{
          margin: 0,
          fontSize: "13px",
          lineHeight: 1.5,
          opacity: 0.85,
        }}
      >
        Accedé rápido a tus cursos, clases, asistencias y pagos — sin abrir el navegador.
      </p>

      {/* Botones */}
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={onDismiss}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "10px",
            border: "1px solid var(--border, #e2e8f0)",
            background: "transparent",
            color: "var(--foreground, #1e293b)",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Ahora no
        </button>
        <button
          onClick={onInstall}
          style={{
            flex: 2,
            padding: "10px",
            borderRadius: "10px",
            border: "none",
            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
            color: "#ffffff",
            fontSize: "14px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(59,130,246,0.35)",
          }}
        >
          📲 Instalar app
        </button>
      </div>

      <style>{`
        @keyframes pwa-slide-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

// ── iOS: modal con instrucciones para "Agregar a pantalla de inicio" ──────────

function IOSInstallModal({
  appName,
  appIcon,
  onDismiss,
}: {
  appName: string;
  appIcon: string;
  onDismiss: () => void;
}) {
  return (
    <>
      {/* Overlay */}
      <div
        onClick={onDismiss}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 9998,
          background: "rgba(0,0,0,0.4)",
          animation: "pwa-fade-in 0.2s ease",
        }}
      />

      {/* Bottom sheet */}
      <div
        role="dialog"
        aria-label={`Cómo instalar ${appName} en iOS`}
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: "var(--background, #ffffff)",
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -4px 32px rgba(0,0,0,0.15)",
          padding: "24px 20px 40px",
          animation: "pwa-slide-up 0.35s cubic-bezier(0.34,1.56,0.64,1)",
          color: "var(--foreground, #1e293b)",
        }}
      >
        {/* Handle */}
        <div
          style={{
            width: "40px",
            height: "4px",
            borderRadius: "2px",
            background: "var(--border, #e2e8f0)",
            margin: "0 auto 20px",
          }}
        />

        {/* Encabezado */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={appIcon}
            alt={appName}
            width={52}
            height={52}
            style={{ borderRadius: "12px", flexShrink: 0, objectFit: "cover" }}
          />
          <div>
            <p
              style={{
                margin: 0,
                fontWeight: 800,
                fontSize: "16px",
              }}
            >
              Instalá la app
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                opacity: 0.7,
              }}
            >
              {appName}
            </p>
          </div>
          <button
            onClick={onDismiss}
            aria-label="Cerrar"
            style={{
              marginLeft: "auto",
              background: "var(--muted, #f1f5f9)",
              border: "none",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              cursor: "pointer",
              fontSize: "16px",
              color: "var(--muted-foreground, #64748b)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Pasos */}
        {[
          {
            icon: "⬆️",
            text: (
              <>
                Tocá el ícono de{" "}
                <strong style={{ color: "#3b82f6" }}>Compartir</strong>{" "}
                (cuadrado con flecha) en la barra de Safari
              </>
            ),
          },
          {
            icon: "➕",
            text: (
              <>
                Seleccioná{" "}
                <strong style={{ color: "#3b82f6" }}>
                  &ldquo;Agregar a pantalla de inicio&rdquo;
                </strong>
              </>
            ),
          },
          {
            icon: "✅",
            text: (
              <>
                Tocá <strong>Agregar</strong> — el ícono aparecerá en tu
                pantalla de inicio
              </>
            ),
          },
        ].map((step, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "14px",
              padding: "12px 0",
              borderBottom: i < 2 ? "1px solid var(--border, #e2e8f0)" : "none",
            }}
          >
            <span
              style={{
                fontSize: "22px",
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--muted, #f1f5f9)",
                borderRadius: "10px",
                flexShrink: 0,
              }}
            >
              {step.icon}
            </span>
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                lineHeight: 1.5,
                paddingTop: "6px",
              }}
            >
              {step.text}
            </p>
          </div>
        ))}

        <style>{`
          @keyframes pwa-slide-up {
            from { opacity: 0; transform: translateY(24px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes pwa-fade-in {
            from { opacity: 0; }
            to   { opacity: 1; }
          }
        `}</style>
      </div>
    </>
  );
}

// ── Componente principal ───────────────────────────────────────────────────────

export function PWAInstallPrompt() {
  const tenant = useTenant();
  const { canInstall, isIOS, isInstalled, showBanner, promptInstall, dismissBanner } =
    usePWAInstall();

  // Sólo mostramos el banner de instalación para clientes con plan PREMIUM
  const isPremium = tenant?.plan === "PREMIUM";
  if (!isPremium) return null;

  // No mostrar si ya está instalada o no hay nada que mostrar
  if (isInstalled || !showBanner) return null;

  const appName = tenant?.name ?? "Lingua Campus";
  const appIcon =
    tenant?.logoUrl?.includes("res.cloudinary.com")
      ? tenant.logoUrl.replace("/upload/", "/upload/c_fill,w_192,h_192,f_png/")
      : "/icon-192x192.png";

  if (canInstall) {
    return (
      <AndroidInstallBanner
        appName={appName}
        appIcon={appIcon}
        onInstall={promptInstall}
        onDismiss={dismissBanner}
      />
    );
  }

  if (isIOS) {
    return (
      <IOSInstallModal
        appName={appName}
        appIcon={appIcon}
        onDismiss={dismissBanner}
      />
    );
  }

  return null;
}
