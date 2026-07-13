"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

interface StudentSearchBarProps {
    initialQuery: string;
    tabParam: string;
}

export function StudentSearchBar({ initialQuery, tabParam }: StudentSearchBarProps) {
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const router = useRouter();
    const pathname = usePathname();

    // Track whether the user is actively typing to avoid overwriting their input
    // when Next.js re-renders the server component mid-typing (race condition).
    const isUserTyping = useRef(false);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Only sync from the prop when the user is NOT actively typing.
    // This prevents the race condition where a server re-render returns the
    // stale initialQuery and overwrites what the user has typed so far.
    useEffect(() => {
        if (!isUserTyping.current) {
            setSearchQuery(initialQuery);
        }
    }, [initialQuery]);

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
                params.set("page", "1"); // reset to page 1 on new search
                router.push(`${pathname}?${params.toString()}`, { scroll: false });
            }
        }, 400);

        return () => clearTimeout(handler);
    }, [searchQuery, pathname, router]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        // Mark the user as actively typing
        isUserTyping.current = true;

        // Clear any previous inactivity timeout
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

        // After 600ms of no input, consider the user done typing so future
        // prop syncs (e.g. clearing the field via external navigation) work again.
        typingTimeoutRef.current = setTimeout(() => {
            isUserTyping.current = false;
        }, 600);

        setSearchQuery(e.target.value);
    }

    function handleClear() {
        isUserTyping.current = false;
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
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
