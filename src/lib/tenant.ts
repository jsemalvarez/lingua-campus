import { cache } from "react";
import prisma from "@/lib/prisma";

// Usamos cache de React para que no se ejecute dos veces en la misma request 
export const getTenantByHost = cache(async (host: string, previewTenantId?: string) => {
  if (previewTenantId) {
    return prisma.institute.findUnique({
      where: { id: previewTenantId },
    });
  }

  const cleanHost = host.split(":")[0]; 
  const hostWithoutWww = cleanHost.replace(/^www\./, '');
  
  if (hostWithoutWww === "lingua-campus.com.ar" || hostWithoutWww === "localhost" || hostWithoutWww === "lingua-campus.vercel.app") {
    return null;
  }

  let subdomainMatch = null;
  if (hostWithoutWww.endsWith(".lingua-campus.com.ar")) {
    subdomainMatch = hostWithoutWww.replace(".lingua-campus.com.ar", "");
  } else if (hostWithoutWww.endsWith(".localhost")) {
    subdomainMatch = hostWithoutWww.replace(".localhost", "");
  } else if (hostWithoutWww.endsWith(".vercel.app")) {
    subdomainMatch = hostWithoutWww.replace(".vercel.app", "");
  }

  return prisma.institute.findFirst({
    where: {
      OR: [
        { customDomain: cleanHost },
        { customDomain: hostWithoutWww },
        { subdomain: cleanHost },
        ...(subdomainMatch && subdomainMatch !== "" ? [{ subdomain: subdomainMatch }] : [])
      ]
    }
  });
});

/**
 * La dirección pública de un instituto — la inversa de `getTenantByHost`.
 *
 * Hace falta para armar links absolutos desde el servidor, donde no existe
 * `window.location.origin`: hoy, el de recuperación de contraseña que viaja por
 * correo (FEAT-05).
 *
 * **Sale de la ficha del instituto y no del host del pedido.** Así el enlace
 * lleva siempre al lugar de esa cuenta, sin importar por dónde se haya pedido la
 * recuperación, y nadie puede hacer que un correo nuestro apunte a otro lado
 * mandando un `Host` cualquiera.
 *
 * Y como stage y producción son dos bases distintas, cada una puede tener su
 * propio valor en la misma columna: el instituto de stage apunta a stage sin que
 * haga falta ninguna variable de entorno. `APP_BASE_DOMAIN` sólo entra en juego
 * para los institutos que todavía no tienen dominio propio.
 */
export function instituteBaseUrl(institute: { subdomain: string; customDomain: string | null }): string {
  if (institute.customDomain) return withProtocol(institute.customDomain);

  const baseDomain = process.env.APP_BASE_DOMAIN ?? "lingua-campus.com.ar";
  return withProtocol(`${institute.subdomain}.${baseDomain}`);
}

function withProtocol(host: string): string {
  if (host.startsWith("http://") || host.startsWith("https://")) return host;

  const isLocal = host === "localhost" || host.startsWith("localhost:") || host.includes(".localhost");
  return `${isLocal ? "http" : "https"}://${host}`;
}
