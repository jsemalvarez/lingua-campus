import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/**
 * La cáscara común de los cuatro listados del panel de uso (FEAT-11).
 *
 * **Por qué los números llevan a una lista.** Un número que no se puede abrir no
 * se acciona: el administrador ve "7 clases sin parte", no sabe cuáles, y a la
 * tercera vez deja de mirarlo. La lista es lo que convierte la métrica en una
 * tanda de trabajo, y por eso cada fila termina en la pantalla donde eso se
 * arregla — la ficha del alumno, el parte de la clase — y no en un detalle que
 * sólo se puede leer.
 *
 * **Los filtros son enlaces y viajan en la URL**, igual que el período. Sale
 * gratis en tiempo de servidor, y de paso "los que no tienen tutor cargado" se
 * puede pasar por mensaje a quien tiene que llamarlos.
 */

export interface OpcionDeFiltro {
    clave: string;
    etiqueta: string;
    cantidad: number;
}

export function CabeceraListado({
    titulo,
    descripcion,
    volverA,
}: {
    titulo: string;
    descripcion: string;
    /** El panel, con el período que traía puesto. */
    volverA: string;
}) {
    return (
        <div className="space-y-3">
            <Link
                href={volverA}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                <ArrowLeft size={15} />
                Panel de uso
            </Link>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{titulo}</h1>
                <p className="text-muted-foreground mt-1">{descripcion}</p>
            </div>
        </div>
    );
}

/**
 * Los estados como filtro, con su conteo al lado.
 *
 * **El conteo se muestra siempre, incluso en cero**, y el chip en cero se
 * deshabilita en vez de esconderse. Esconderlo haría que la lista de filtros
 * cambie de forma según el mes que se mire, y que "no hay ninguna incompleta"
 * —que es una buena noticia— sea indistinguible de "esta pantalla no mide eso".
 */
export function Filtros({
    base,
    actual,
    opciones,
}: {
    /** Ruta del listado con lo que no es el filtro ya puesto (período, etc.). */
    base: string;
    actual: string;
    opciones: OpcionDeFiltro[];
}) {
    const unir = (clave: string) =>
        clave === "todos" ? base : `${base}${base.includes("?") ? "&" : "?"}estado=${clave}`;

    return (
        <div className="flex flex-wrap gap-2">
            {opciones.map((o) => {
                const activo = o.clave === actual;
                const vacio = o.cantidad === 0 && !activo;

                const clases = activo
                    ? "bg-primary text-primary-foreground border-primary"
                    : vacio
                        ? "border-border text-muted-foreground/50 pointer-events-none"
                        : "border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground";

                return (
                    <Link
                        key={o.clave}
                        href={unir(o.clave)}
                        aria-disabled={vacio || undefined}
                        tabIndex={vacio ? -1 : undefined}
                        className={`inline-flex items-center gap-2 h-9 px-3.5 rounded-lg border text-[13px] font-medium transition-colors ${clases}`}
                    >
                        {o.etiqueta}
                        <span
                            className={`tabular-nums text-xs font-semibold ${activo ? "text-primary-foreground/80" : "text-muted-foreground/70"
                                }`}
                        >
                            {o.cantidad}
                        </span>
                    </Link>
                );
            })}
        </div>
    );
}

/** Lo que se muestra cuando el filtro elegido no tiene ninguna fila. */
export function ListaVacia({ children }: { children: React.ReactNode }) {
    return (
        <div className="py-16 text-center">
            <p className="text-sm text-muted-foreground">{children}</p>
        </div>
    );
}

/** El encabezado de una columna, para que las cuatro tablas se vean igual. */
export function Th({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <th
            className={`text-left px-3 pb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ${className}`}
        >
            {children}
        </th>
    );
}
