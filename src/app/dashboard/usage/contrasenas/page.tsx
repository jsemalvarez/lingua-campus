import { redirect } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { requireRole } from "@/lib/authz";
import { CabeceraListado, Filtros, ListaVacia, Th } from "../Listado";
import { cargarContrasenas, NOMBRE_DEL_GRUPO, type Grupo } from "./datos";

export const dynamic = "force-dynamic";

/**
 * El listado detrás de la métrica 6 del panel de uso (FEAT-11).
 *
 * **Es una lista de trabajo pendiente, no de sospechosos.** Cada fila es una
 * cuenta a la que hay que pedirle que cambie la contraseña, y por eso lleva el
 * teléfono y el enlace a su ficha. Cuando exista SEC-11 —el cambio obligatorio
 * en el primer ingreso— esta lista se vacía sola y la pantalla deja de hacer
 * falta.
 */

const GRUPOS: Grupo[] = ["alumno", "tutor", "profesor", "administracion"];

export default async function ContrasenasUsagePage({
    searchParams,
}: {
    searchParams: Promise<{ grupo?: string; p?: string }>;
}) {
    const auth = await requireRole(["ADMIN"]);
    if (!auth) redirect("/dashboard");

    const { grupo, p } = await searchParams;
    const datos = await cargarContrasenas(auth.instituteId);

    const filtro = GRUPOS.includes(grupo as Grupo) ? (grupo as Grupo) : "todos";
    const visibles =
        filtro === "todos" ? datos.cuentas : datos.cuentas.filter((c) => c.grupo === filtro);

    const volverA = p ? `/dashboard/usage?p=${p}` : "/dashboard/usage";
    const base = p ? `/dashboard/usage/contrasenas?p=${p}` : "/dashboard/usage/contrasenas";

    return (
        <div className="min-h-screen bg-background">
            <Navbar currentActiveRole={auth.activeRole} />

            <main className="container mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CabeceraListado
                    titulo="Cuentas con la contraseña por defecto"
                    descripcion={`${datos.total} cuentas activas conservan una de las contraseñas que reparte el sistema.`}
                    volverA={volverA}
                />

                <Filtros
                    base={base}
                    actual={filtro}
                    param="grupo"
                    opciones={[
                        { clave: "todos", etiqueta: "Todas", cantidad: datos.cuentas.length },
                        ...GRUPOS.map((g) => ({
                            clave: g,
                            etiqueta: NOMBRE_DEL_GRUPO[g],
                            cantidad: datos.porGrupo[g],
                        })),
                    ]}
                />

                <Card className="overflow-hidden">
                    {visibles.length === 0 ? (
                        <ListaVacia>
                            {datos.cuentas.length === 0
                                ? "Ninguna cuenta activa conserva la contraseña que le dio el sistema."
                                : "Ninguna cuenta de ese grupo está en esa situación."}
                        </ListaVacia>
                    ) : (
                        <div className="overflow-x-auto -mx-2">
                            <table className="w-full min-w-[680px]">
                                <thead>
                                    <tr className="border-b border-border">
                                        <Th>Cuenta</Th>
                                        <Th>Grupo</Th>
                                        <Th>Email o DNI</Th>
                                        <Th>Teléfono</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibles.map((c) => (
                                        <tr
                                            key={`${c.grupo}-${c.id}`}
                                            className="border-b border-border/50 last:border-0"
                                        >
                                            <td className="px-3 py-3">
                                                {c.ficha ? (
                                                    <Link
                                                        href={c.ficha}
                                                        className="text-sm font-medium hover:text-primary transition-colors"
                                                    >
                                                        {c.nombre}
                                                    </Link>
                                                ) : (
                                                    <span className="text-sm font-medium">{c.nombre}</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-3 text-sm text-muted-foreground">
                                                {NOMBRE_DEL_GRUPO[c.grupo]}
                                            </td>
                                            <td className="px-3 py-3 text-sm text-muted-foreground">
                                                {c.identificador}
                                            </td>
                                            <td className="px-3 py-3 text-sm tabular-nums">
                                                {c.telefono || <span className="text-muted-foreground/50">—</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </main>
        </div>
    );
}
