import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lingua Campus — Gestión Administrativa",
  description: "Plataforma de gestión para institutos de idiomas. Administrá alumnos, cursos, pagos y más.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7fc" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0e14" },
  ],
};

/**
 * Script inline anti-flash: se ejecuta ANTES de que React hidrate.
 * Lee localStorage y aplica la clase .dark / o .light al <html>
 * antes de que el navegador pinte cualquier pixel.
 */
const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('lingua-theme');
    var root = document.documentElement;
    if (stored === 'dark') {
      root.classList.add('dark');
    } else if (stored === 'light') {
      root.classList.add('light');
      root.classList.remove('dark');
    } else {
      // 'system' o sin preferencia: respetar el OS
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      }
    }
  } catch(e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className="scroll-smooth">
      <head>
        {/* Script anti-flash: sincroniza el tema ANTES del primer paint */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} antialiased min-h-screen bg-background text-foreground`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
