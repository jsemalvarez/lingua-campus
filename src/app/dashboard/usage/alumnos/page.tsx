import { redirect } from "next/navigation";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { requireRole } from "@/lib/authz";
import prisma from "@/lib/prisma";
import { clasificarAlumno, type EstadoAlumno } from "../metricas";
import { CabeceraListado, Filtros, ListaVacia, Th } from "../Listado";

export const dynamic = "force-dynamic";

/**
 * El listado detrás de la métrica 4 del panel de uso (FEAT-11).
 *
 * **Un listado con el estado como filtro, y no una pantalla por estado.** Son
 * cinco números en el mosaico y serían cinco pantallas casi idénticas; además,
 * quien abre "con datos y sin cuenta" muchas veces quiere mirar enseguida "sin
 * ningún dato", que es el mismo trabajo con otro grado de dificultad.
 *
 * **La columna que importa es el teléfono.** Esta lista existe para llamar: el
 * mosaico dice cuántos son, la lista dice a quién y con qué número.
 */

const ESTADOS: { clave: EstadoAlumno | "todos"; etiqueta: string }[] = [
    { clave: "todos", etiqueta: "Todos" },
    { clave: "con-cuenta", etiqueta: "Con cuenta de tutor" },
    { clave: "con-datos", etiqueta: "Con datos, sin cuenta" },
    { clave: "sin-nada", etiqueta: "Sin ningún dato" },
    { clave: "firma-solo", etiqueta: "Mayores de 20" },
    { clave: "sin-fecha", etiqueta: "Sin fecha de nacimiento" },
];

const DISTINTIVO: Record<EstadoAlumno, { texto: string; clases: string }> = {
    "con-cuenta": { texto: "Con cuenta", clases: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-500" },
    "con-datos": { texto: "Sin cuenta", clases: "bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-500" },
    "sin-nada": { texto: "Sin datos", clases: "bg-red-500/10 text-red-600 border-red-500/20" },
    "firma-solo": { texto: "Firma solo", clases: "bg-primary/10 text-primary border-primary/20" },
    "sin-fecha": { texto: "Sin fecha", clases: "bg-muted text-muted-foreground border-border" },
};

export default async function AlumnosUsagePage({
    searchParams,
}: {
    searchParams: Promise<{ estado?: string; p?: string }>;
}) {
    const auth = await requireRole(["ADMIN"]);
    if (!auth) redirect("/dashboard");

    const { estado, p } = await searchParams;
    const hoy = new Date();

    const alumnos = await prisma.student.findMany({
        where: { instituteId: auth.instituteId, status: "ACTIVE" },
        select: {
            id: true,
            name: true,
            dni: true,
            birthDate: true,
            guardian1Name: true,
            guardian1Relation: true,
            guardian1Phone: true,
            guardian1Email: true,
            guardian2Name: true,
            guardian2Relation: true,
            guardian2Phone: true,
            guardian2Email: true,
            guardianLinks: {
                select: {
                    relation: true,
                    guardian: { select: { id: true, name: true, phone: true, email: true } },
                },
            },
        },
        orderBy: { name: "asc" },
    });

    const clasificados = alumnos.map((a) => ({
        ...a,
        estado: clasificarAlumno({ ...a, vinculos: a.guardianLinks.length }, hoy),
    }));

    const cuantos = (clave: string) =>
        clave === "todos"
            ? clasificados.length
            : clasificados.filter((a) => a.estado === clave).length;

    const filtro = ESTADOS.some((e) => e.clave === estado) ? estado! : "todos";
    const visibles =
        filtro === "todos" ? clasificados : clasificados.filter((a) => a.estado === filtro);

    // El período no gobierna nada de esta métrica —es de la zona "Estado de
    // hoy"—, pero se arrastra para que volver al panel no pierda el mes que el
    // administrador estaba mirando.
    const volverA = p ? `/dashboard/usage?p=${p}` : "/dashboard/usage";
    const base = p ? `/dashboard/usage/alumnos?p=${p}` : "/dashboard/usage/alumnos";

    return (
        <div className="min-h-screen bg-background">
            <Navbar currentActiveRole={auth.activeRole} />

            <main className="container mx-auto px-4 sm:px-6 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CabeceraListado
                    titulo="Alumnos y su tutor"
                    descripcion={`${clasificados.length} alumnos activos. Quién tiene tutor con cuenta, quién tiene los datos cargados y a quién hay que llamar.`}
                    volverA={volverA}
                />

                <Filtros
                    base={base}
                    actual={filtro}
                    opciones={ESTADOS.map((e) => ({ ...e, cantidad: cuantos(e.clave) }))}
                />

                <Card className="overflow-hidden">
                    {visibles.length === 0 ? (
                        <ListaVacia>Ningún alumno activo está en esa situación.</ListaVacia>
                    ) : (
                        <div className="overflow-x-auto -mx-2">
                            <table className="w-full min-w-[720px]">
                                <thead>
                                    <tr className="border-b border-border">
                                        <Th>Alumno</Th>
                                        <Th>DNI</Th>
                                        <Th>Situación</Th>
                                        <Th>Tutor</Th>
                                        <Th>Teléfono</Th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {visibles.map((a) => {
                                        const distintivo = DISTINTIVO[a.estado];
                                        const cargados = [
                                            {
                                                nombre: a.guardian1Name,
                                                relacion: a.guardian1Relation,
                                                telefono: a.guardian1Phone,
                                                email: a.guardian1Email,
                                            },
                                            {
                                                nombre: a.guardian2Name,
                                                relacion: a.guardian2Relation,
                                                telefono: a.guardian2Phone,
                                                email: a.guardian2Email,
                                            },
                                        ].filter((g) => g.nombre || g.email);

                                        const telefonos = a.guardianLinks.length > 0
                                            ? a.guardianLinks.map((l) => l.guardian.phone).filter(Boolean)
                                            : cargados.map((g) => g.telefono).filter(Boolean);

                                        return (
                                            <tr key={a.id} className="border-b border-border/50 last:border-0">
                                                <td className="px-3 py-3">
                                                    <Link
                                                        href={`/students/${a.id}`}
                                                        className="text-sm font-medium hover:text-primary transition-colors"
                                                    >
                                                        {a.name}
                                                    </Link>
                                                </td>
                                                <td className="px-3 py-3 text-sm text-muted-foreground tabular-nums">
                                                    {a.dni || <span className="text-muted-foreground/50">—</span>}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <span
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${distintivo.clases}`}
                                                    >
                                                        {distintivo.texto}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3 text-sm">
                                                    {a.guardianLinks.length > 0 ? (
                                                        <span className="flex flex-wrap gap-x-2 gap-y-1">
                                                            {a.guardianLinks.map((l) => (
                                                                <Link
                                                                    key={l.guardian.id}
                                                                    href={`/guardians/${l.guardian.id}`}
                                                                    className="hover:text-primary transition-colors"
                                                                >
                                                                    {l.guardian.name}
                                                                    {l.relation && (
                                                                        <span className="text-muted-foreground">
                                                                            {" "}
                                                                            ({l.relation})
                                                                        </span>
                                                                    )}
                                                                </Link>
                                                            ))}
                                                        </span>
                                                    ) : cargados.length > 0 ? (
                                                        <span className="text-muted-foreground">
                                                            {cargados
                                                                .map((g) =>
                                                                    g.relacion
                                                                        ? `${g.nombre ?? g.email} (${g.relacion})`
                                                                        : g.nombre ?? g.email
                                                                )
                                                                .join(" · ")}
                                                        </span>
                                                    ) : (
                                                        <span className="text-muted-foreground/50">—</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 text-sm tabular-nums">
                                                    {telefonos.length > 0 ? (
                                                        telefonos.join(" · ")
                                                    ) : (
                                                        <span className="text-muted-foreground/50">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </main>
        </div>
    );
}
