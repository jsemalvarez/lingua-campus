"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LayoutDashboard, LogOut, UserCircle } from "lucide-react";
import { signOut } from "next-auth/react";

function SectionLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
    return (
        <Link
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
                "inline-flex items-center gap-2 min-h-9 px-3 rounded-lg text-sm transition-colors",
                active ? "font-semibold text-primary bg-primary/10" : "font-medium text-muted-foreground hover:text-foreground"
            )}
        >
            {children}
        </Link>
    );
}

/**
 * Navbar exclusivo del panel GlobalAdmin (SUPERADMIN).
 * Componente cliente necesario para ThemeToggle.
 *
 * `newErrors` es la insignia de «Errores»: la pasa cada página, porque esto corre
 * en el navegador. Donde no se pasa, el enlace queda sin insignia.
 */
export function AdminNavbar({ newErrors = 0 }: { newErrors?: number }) {
    const pathname = usePathname();

    const sections = (
        <>
            <SectionLink href="/admin/institutes" active={pathname.startsWith("/admin/institutes")}>
                Institutos
            </SectionLink>
            <SectionLink href="/admin/errors" active={pathname.startsWith("/admin/errors")}>
                Errores
                {newErrors > 0 && (
                    <span className="text-[11px] font-bold px-2 py-px rounded-full text-white bg-orange-700">
                        {newErrors} {newErrors === 1 ? "nuevo" : "nuevos"}
                    </span>
                )}
            </SectionLink>
        </>
    );

    return (
        <nav className="sticky top-0 z-50 w-full glass border-b border-border/50">
            <div className="container mx-auto h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6">
                <div className="flex items-center gap-4 lg:gap-6 min-w-0">
                    {/* Logo */}
                    <div className="flex items-center gap-2">
                        <div className="h-7 w-7 sm:h-8 sm:w-8 premium-gradient rounded-lg flex items-center justify-center text-white font-bold text-sm">
                            L
                        </div>
                        <span className="font-bold text-base sm:text-xl text-foreground/90">
                            Lingua{" "}
                            <span className="text-primary font-extrabold italic">GlobalAdmin</span>
                        </span>
                    </div>

                    <div className="hidden md:flex items-center gap-1">{sections}</div>
                </div>

                {/* Acciones */}
                <div className="flex items-center gap-2 sm:gap-3">
                    {/* Theme toggle icon */}
                    <ThemeToggle variant="icon" />

                    {/* Volver al dashboard — solo si hubiera uno */}
                    <Link href="/dashboard">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="hidden sm:inline-flex items-center gap-1.5 text-xs sm:text-sm"
                        >
                            <LayoutDashboard size={15} />
                            Dashboard
                        </Button>
                    </Link>

                    {/* Link a Perfil */}
                    <Link href="/profile">
                        <Button
                            variant="ghost"
                            size="icon"
                            title="Mi Perfil"
                            className="text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors h-9 w-9 rounded-xl border border-transparent hover:border-primary/20"
                        >
                            <UserCircle size={17} />
                        </Button>
                    </Link>

                    {/* Botón de cerrar sesión */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => signOut({ callbackUrl: '/login' })}
                        title="Cerrar sesión"
                        className="text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors h-9 w-9 rounded-xl border border-transparent hover:border-red-200 dark:hover:border-red-900/50"
                    >
                        <LogOut size={17} />
                    </Button>
                </div>
            </div>

            {/* En el celular las secciones no entran al lado del logo. */}
            <div className="md:hidden flex items-center gap-1 px-4 pb-2">{sections}</div>
        </nav>
    );
}
