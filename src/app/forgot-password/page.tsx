import { headers } from "next/headers";
import { getTenantByHost } from "@/lib/tenant";
import ForgotPasswordForm from "./ForgotPasswordForm";
import type { Metadata } from "next";

// El layout ya arma el título con `template: "%s | <marca>"`, y la marca la
// resuelve por instituto. Repetirla acá la escribe dos veces.
export const metadata: Metadata = {
    title: "Recuperar contraseña",
    description: "Pedí un enlace para elegir una contraseña nueva.",
};

export default async function ForgotPasswordPage() {
    const headersList = await headers();
    const host = headersList.get("host") || "";

    const institute = await getTenantByHost(host);

    return <ForgotPasswordForm institute={institute} />;
}
