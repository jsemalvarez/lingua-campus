import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { requireRole } from "@/lib/authz";
import { ResourcesView } from "./components/ResourcesView";

export const metadata = {
    title: "Recursos",
};

/**
 * Recursos para el docente (PED-09): herramientas externas para las clases, cada
 * una con su guía de primeros pasos. El contenido es fijo (`tools.ts`), no lee la
 * base. Es del rol docente: quien además administra entra cambiando de rol, como
 * en el resto del campus.
 */
export default async function ResourcesPage() {
    const user = await requireRole(["TEACHER"]);
    if (!user) redirect("/dashboard");

    return (
        <div className="min-h-screen bg-background pb-24">
            <Navbar currentActiveRole={user.activeRole} />
            <ResourcesView />
        </div>
    );
}
