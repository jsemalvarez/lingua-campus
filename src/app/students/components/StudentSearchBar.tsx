"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface StudentSearchBarProps {
    initialQuery: string;
    tabParam: string;
}

export function StudentSearchBar({ initialQuery, tabParam }: StudentSearchBarProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    
    // Obtenemos la query actual de la URL en tiempo real
    const urlQuery = searchParams.get("q") || "";

    // 1. El estado del input sólo contiene el texto localmente
    const [searchQuery, setSearchQuery] = useState(urlQuery);

    // 2. Usamos una referencia para saber si el cambio en la URL fue iniciado por tipeo del usuario
    const isTypingRef = useRef(false);

    // Sincronizar el input con la URL ÚNICAMENTE cuando la URL cambia por un motivo externo 
    // (por ejemplo: al volver a la página de estudiantes desde otro lado, cambiar de pestaña,
    // o limpiar la búsqueda desde otra acción). 
    // Si isTypingRef.current es true, significa que el usuario causó el cambio en la URL,
    // por lo tanto no tocamos el input para evitar cortarle la escritura (race condition).
    useEffect(() => {
        if (!isTypingRef.current) {
            setSearchQuery(urlQuery);
        }
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
            // Una vez que el router.push se procesó y la URL se actualizó,
            // permitimos que futuras actualizaciones de URL externas puedan resetear el input
            isTypingRef.current = false;
        }, 400);

        return () => clearTimeout(handler);
    }, [searchQuery, pathname, router]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        isTypingRef.current = true;
        setSearchQuery(e.target.value);
    }

    function handleClear() {
        isTypingRef.current = false;
        setSearchQuery("");
    }

    return (
        <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <input
                type="text"
                placeholder="Buscar por nombre, email o teléfono..."
                className="w-full pl-10 pr-10 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring/30 transition-all text-sm font-medium"
                value={searchQuery}
                onChange={handleChange}
            />
            {searchQuery && (
                <button
                    type="button"
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    );
}
