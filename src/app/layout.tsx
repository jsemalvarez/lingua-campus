import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { headers } from "next/headers";
import { getTenantByHost } from "@/lib/tenant";
import { TenantProvider } from "@/components/providers/TenantProvider";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const institute = await getTenantByHost(host);

  const brandName = institute?.name ?? "Lingua Campus";
  const description = institute
    ? `Plataforma de gestión para ${institute.name}. Administrá alumnos, cursos, pagos y más.`
    : "Plataforma de gestión para institutos de idiomas. Administrá alumnos, cursos, pagos y más.";

  // Dynamic icon logic for iOS (apple-touch-icon)
  // @ts-ignore
  const isPremium = institute?.plan === 'PREMIUM';
  const isInternalDomain = host.includes('lingua-campus') || host.includes('vercel.app') || host.includes('localhost');
  const isCustomDomain = !isInternalDomain;

  const isDefaultBrand = !institute || !isPremium || !isCustomDomain;
  const hasCloudinaryLogo = !isDefaultBrand && institute?.logoUrl?.includes('res.cloudinary.com');

  function buildCloudinaryIcon(logoUrl: string, size: number): string {
    return logoUrl.replace('/upload/', `/upload/c_fill,w_${size},h_${size},f_png/`);
  }

  // @ts-ignore
  const appleIcon = hasCloudinaryLogo
    ? buildCloudinaryIcon(institute!.logoUrl!, 192)
    // @ts-ignore
    : (!isDefaultBrand && institute?.pwaIcon192 ? institute.pwaIcon192 : '/icon-192x192.png');

  return {
    title: {
      default: `${brandName} — Gestión Administrativa`,
      template: `%s | ${brandName}`,
    },
    description,
    manifest: "/manifest.json",
    applicationName: brandName,
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: brandName,
    },
    formatDetection: {
      telephone: false,
    },
    icons: {
      apple: appleIcon,
    },
  };
}

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const institute = await getTenantByHost(host);
  
  const tenant = institute ? { name: institute.name, logoUrl: institute.logoUrl } : null;

  return (
    <html lang="es" suppressHydrationWarning className="scroll-smooth">
      <head>
        {/* Script anti-flash: sincroniza el tema ANTES del primer paint */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} antialiased min-h-screen bg-background text-foreground`}>
        <TenantProvider tenant={tenant}>
          <Providers>
            {children}
          </Providers>
        </TenantProvider>
      </body>
    </html>
  );
}
