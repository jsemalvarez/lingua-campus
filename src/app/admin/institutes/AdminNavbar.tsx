"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LayoutDashboard, LogOut, UserCircle } from "lucide-react";
import { signOut } from "next-auth/react";

/**
 * Navbar exclusivo del panel GlobalAdmin (SUPERADMIN).
 * Componente cliente necesario para ThemeToggle.
 */
export function AdminNavbar() {
    return (
        <nav className="sticky top-0 z-50 w-full glass border-b border-border/50">
            <div className="container mx-auto h-14 sm:h-16 flex items-center justify-between px-4 sm:px-6">
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
        </nav>
    );
}
