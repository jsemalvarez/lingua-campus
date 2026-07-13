"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface StudentSearchBarProps {
    initialQuery: string;
    tabParam: string;
}

export function StudentSearchBar({ initialQuery, tabParam }: StudentSearchBarProps) {
    // 1. Inicializamos el estado interno únicamente con el prop inicial.
    // Evitamos por completo el useEffect de sincronización bidireccional que pisa el input.
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // 2. Si el parámetro de búsqueda en la URL cambia externamente (ej: el usuario limpia la URL
    // o cambia de pestaña/sección y la query desaparece de la URL), sincronizamos el estado.
    // Pero lo hacemos comparando directamente con los searchParams de lectura en el cliente
    // (que cambian inmediatamente al navegar) en lugar de depender del ciclo de renderizado 
    // y propagación de props del servidor.
    const urlQuery = searchParams.get("q") || "";
    useEffect(() => {
        setSearchQuery(urlQuery);
    }, [urlQuery]);

    // 3. Debounce para enviar la búsqueda al servidor.
    useEffect(() => {
        const handler = setTimeout(() => {
            const params = new URLSearchParams(window.location.search);
            const currentSearch = params.get("q") || "";
            if (searchQuery !== currentSearch) {
                if (searchQuery) {
                    params.set("q", searchQuery);
                } else {
                    params.delete("q");
                }
                params.set("page", "1"); // reset a página 1 al buscar
                router.push(`${pathname}?${params.toString()}`, { scroll: false });
            }
        }, 400);

        return () => clearTimeout(handler);
    }, [searchQuery, pathname, router]);

    return (
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
                type="text"
                placeholder="Buscar por nombre, email o teléfono..."
                className="w-full pl-10 pr-10 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all text-sm font-medium"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
                <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
