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
