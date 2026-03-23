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
  const isMainDomain = 
    (host.includes("localhost") && !host.includes(".localhost")) || 
    host === "lingua-campus.com.ar" || 
    host.includes("vercel.app");
  
  if (!isMainDomain) {
    // It's a custom domain, format it to match what's in DB (remove port if any)
    const cleanHost = host.split(":")[0]; 
    
    // Find the institute by custom domain
    const institute = await prisma.institute.findFirst({
      where: {
        customDomain: cleanHost
      }
    });

    if (institute) {
      return <InstituteLanding institute={institute} />;
    }
  }

  // 3. Fallback to the main SaaS landing
  return <LinguaCampusLanding />;
}
