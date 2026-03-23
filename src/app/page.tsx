import { headers } from "next/headers";
import prisma from "@/lib/prisma";
import LinguaCampusLanding from "@/components/landing/LinguaCampusLanding";
import InstituteLanding from "@/components/landing/InstituteLanding";

export default async function IndexPage({
  searchParams,
}: {
  searchParams: Promise<{ preview_tenant?: string }>;
}) {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const params = await searchParams;
  
  // 1. Check for manual URL preview parameter first (for local testing)
  // e.g., http://localhost:3000/?preview_tenant=1234
  if (params.preview_tenant) {
    const institute = await prisma.institute.findUnique({
      where: { id: params.preview_tenant },
    });
    if (institute) {
      return <InstituteLanding institute={institute} />;
    }
  }

  // 2. Identify the tenant by host
  const cleanHost = host.split(":")[0]; 
  const hostWithoutWww = cleanHost.replace(/^www\./, '');
  
  // Si están entrando directamente al dominio principal del SaaS, mostramos Lingua Campus
  if (hostWithoutWww === "lingua-campus.com.ar" || hostWithoutWww === "localhost" || hostWithoutWww === "lingua-campus.vercel.app") {
    return <LinguaCampusLanding />;
  }

  // Extraer posible subdominio
  let subdomainMatch = null;
  if (hostWithoutWww.endsWith(".lingua-campus.com.ar")) {
    subdomainMatch = hostWithoutWww.replace(".lingua-campus.com.ar", "");
  } else if (hostWithoutWww.endsWith(".localhost")) {
    subdomainMatch = hostWithoutWww.replace(".localhost", "");
  } else if (hostWithoutWww.endsWith(".vercel.app")) {
    subdomainMatch = hostWithoutWww.replace(".vercel.app", "");
  }

  // Find the institute by custom domain OR subdomain
  const institute = await prisma.institute.findFirst({
    where: {
      OR: [
        { customDomain: cleanHost },
        { customDomain: hostWithoutWww },
        { subdomain: cleanHost }, 
        ...(subdomainMatch && subdomainMatch !== "" ? [{ subdomain: subdomainMatch }] : [])
      ]
    }
  });

  if (institute) {
    return <InstituteLanding institute={institute} />;
  }

  // 3. Fallback to the main SaaS landing si no encontró el instituto
  return <LinguaCampusLanding />;
}
