import { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const headersList = await headers();
  const host = headersList.get('host') || '';

  let institute = null;
  try {
    if (host.includes('localhost') || host.includes('127.0.0.1')) {
      institute = await prisma.institute.findFirst({
          orderBy: { createdAt: 'asc' }
      });
    } else {
      const subdomain = host.split('.')[0];
      institute = await prisma.institute.findFirst({
        where: {
          OR: [
            { subdomain: subdomain },
            { customDomain: host },
            { customDomain: `https://${host}` },
            { customDomain: `http://${host}` },
          ],
        },
      });
    }
  } catch (error) {
    console.error("Error fetching institute for manifest:", error);
    // Continue with institute = null
  }

  // Branding por defecto (Lingua Campus) 
  // Solo permitimos marca personalizada si:
  // 1. El instituto tiene un plan PREMIUM.
  // 2. NO están usando nuestro subdominio (lingua-campus.com.ar o vercel.app para pruebas).
  // 3. NO están en localhost (opcional, para desarrollo).
  
  // @ts-ignore
  const isPremium = institute?.plan === 'PREMIUM';
  const isInternalDomain = host.includes('lingua-campus') || host.includes('vercel.app') || host.includes('localhost');
  const isCustomDomain = !isInternalDomain;
  
  const isDefaultBrand = !institute || !isPremium || !isCustomDomain;
  
  const name = (isDefaultBrand || !institute) ? 'Lingua Campus' : institute.name;
  const shortName = (isDefaultBrand || !institute) ? 'LinguaCampus' : (institute.name.split(' ')[0] || 'Instituto');
  const description = (isDefaultBrand || !institute)
    ? 'Gestión Administrativa para Institutos de Idiomas' 
    : `Plataforma de gestión para ${institute.name}`;

  // @ts-ignore - pwaIcon fields are newly added
  const icon192 = !isDefaultBrand && institute?.pwaIcon192 ? institute.pwaIcon192 : '/icon-192x192.png';
  // @ts-ignore
  const icon512 = !isDefaultBrand && institute?.pwaIcon512 ? institute.pwaIcon512 : '/icon-512x512.png';

  return {
    name: name,
    short_name: shortName,
    description: description,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#3b82f6',
    icons: [
      {
        src: icon192,
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: icon512,
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}
