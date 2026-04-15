"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown } from "lucide-react";

interface EntityOption {
    id: string;
    name: string;
}

interface EntitySearchProps {
    entities: EntityOption[];
    selectedEntity: EntityOption | null;
    onSelect: (entity: EntityOption | null) => void;
    placeholder?: string;
    label?: string;
    name: string; // El nombre del campo hidden para el form (studentId, recipientId, etc)
    colorTheme?: "emerald" | "rose" | "primary";
}

export function EntitySearch({ 
    entities, 
    selectedEntity, 
    onSelect, 
    placeholder = "🔍 Buscar...",
    label = "Seleccionar",
    name,
    colorTheme = "primary"
}: EntitySearchProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const normalizeString = (str: string) => {
        return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    };

    const filteredEntities = searchQuery.trim() === ""
        ? entities
        : entities.filter(e => normalizeString(e.name).includes(normalizeString(searchQuery)));

    const themeClasses = {
        emerald: "border-emerald-500 ring-emerald-500/20",
        rose: "border-rose-500 ring-rose-500/20",
        primary: "border-primary ring-2 ring-primary/20 bg-background"
    };

    return (
        <div className="space-y-1.5 relative" ref={dropdownRef}>
            {label && <label className="text-sm font-semibold">{label}</label>}
            <div
                className={`relative w-full min-h-[44px] px-3 py-2 rounded-lg border text-sm flex items-center justify-between transition-all cursor-text ${isDropdownOpen ? themeClasses[colorTheme] : 'border-input bg-background/50 hover:bg-background shadow-sm'}`}
                onClick={() => setIsDropdownOpen(true)}
            >
                <div className="flex-1 flex items-center gap-2 overflow-hidden w-full">
                    {isDropdownOpen ? (
                        <>
                            <Search size={16} className="text-muted-foreground shrink-0" />
                            <input
                                autoFocus
                                className="w-full bg-transparent outline-none border-none p-0 text-sm focus:ring-0 text-foreground"
                                placeholder="Buscar por nombre..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </>
                    ) : (
                        <span className={`truncate w-full block ${selectedEntity ? "text-foreground font-bold" : "text-muted-foreground"}`}>
                            {selectedEntity ? selectedEntity.name : placeholder}
                        </span>
                    )}
                </div>
                <ChevronDown size={16} className={`text-muted-foreground shrink-0 ml-2 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
            </div>

            {isDropdownOpen && (
                <div className="absolute top-[calc(100%+4px)] left-0 w-full max-h-56 overflow-y-auto bg-card border border-border shadow-xl rounded-xl z-[100] animate-in fade-in slide-in-from-top-1 p-1">
                    {filteredEntities.length === 0 ? (
                        <div className="p-4 text-sm text-center text-muted-foreground">
                            No se encontraron resultados.
                        </div>
                    ) : (
                        filteredEntities.map(e => (
                            <div
                                key={e.id}
                                className="px-3 py-2.5 text-sm rounded-lg hover:bg-primary/10 hover:text-primary font-medium cursor-pointer transition-colors"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onSelect(e);
                                    setSearchQuery("");
                                    setIsDropdownOpen(false);
                                }}
                            >
                                {e.name}
                            </div>
                        ))
                    )}
                    {selectedEntity && (
                         <div
                            className="px-3 py-2 text-xs text-center border-t border-border mt-1 text-red-500 hover:bg-red-50 cursor-pointer"
                            onClick={(event) => {
                                event.stopPropagation();
                                onSelect(null);
                                setSearchQuery("");
                                setIsDropdownOpen(false);
                            }}
                        >
                            Quitar selección
                        </div>
                    )}
                </div>
            )}
            
            {/* Hidden Input for Form Data compatibility */}
            <input type="hidden" name={name} value={selectedEntity?.id || ""} />
        </div>
    );
}
