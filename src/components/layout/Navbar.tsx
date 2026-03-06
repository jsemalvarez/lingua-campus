"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Menu, X, LayoutDashboard, Users, DollarSign, Clock, BookOpen, LogOut, LogIn } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

/**
 * Premium dashboard navigation bar.
 * Mobile-first: hamburger menu en mobile, links inline en desktop.
 * Incluye ThemeToggle para cambiar claro/oscuro/sistema.
 */
export function Navbar({ className }: { className?: string }) {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const pathname = usePathname();
    const { data: session, status } = useSession();

    const allNavLinks = [
        { href: "/dashboard", label: "Resumen", icon: LayoutDashboard, roles: ["ADMIN", "TEACHER", "STUDENT"] },
        { href: "/teachers", label: "Profesores", icon: Users, roles: ["ADMIN"] },
        { href: "/students", label: "Estudiantes", icon: Users, roles: ["ADMIN", "TEACHER"] },
        { href: "/courses", label: "Cursos", icon: BookOpen, roles: ["ADMIN", "TEACHER"] },
        { href: "/schedule", label: "Calendario", icon: Clock, roles: ["ADMIN", "TEACHER", "STUDENT"] },
        { href: "/payments", label: "Pagos", icon: DollarSign, roles: ["ADMIN", "STUDENT"] },
    ];

    const userRole = (session?.user as any)?.role || "TEACHER"; // Default fallback
    const navLinks = allNavLinks.filter(link => link.roles.includes(userRole));

    // Cerrar menú al cambiar de ruta
    React.useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

    // Bloquear scroll del body cuando el menú está abierto
    React.useEffect(() => {
        document.body.style.overflow = isMenuOpen ? "hidden" : "";
        return () => { document.body.style.overflow = ""; };
    }, [isMenuOpen]);

    return (
        <>
            <nav
                className={cn(
                    "sticky top-0 z-50 w-full glass border-b border-border/50",
                    className
                )}
            >
                <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">

                    {/* ── Logo ── */}
                    <Link href="/dashboard" className="flex items-center gap-2 group shrink-0">
                        <div className="h-7 w-7 sm:h-8 sm:w-8 premium-gradient rounded-lg flex items-center justify-center text-white font-bold text-sm group-hover:scale-105 transition-transform">
                            L
                        </div>
                        <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground/90 group-hover:text-primary transition-colors">
                            Lingua <span className="text-primary">Campus</span>
                        </span>
                    </Link>

                    {/* ── Desktop nav links ── */}
                    {status === "authenticated" && (
                        <div className="hidden md:flex items-center gap-1">
                            {navLinks.map(({ href, label }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
                                        pathname === href
                                            ? "bg-primary/10 text-primary"
                                            : "text-foreground/65 hover:text-foreground hover:bg-muted"
                                    )}
                                >
                                    {label}
                                </Link>
                            ))}
                        </div>
                    )}

                    {/* ── Right side actions ── */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Theme toggle — siempre visible */}
                        <ThemeToggle variant="icon" />

                        {status === "authenticated" ? (
                            <>
                                {/* Avatar — visible en sm+ */}
                                <Link href="/profile"
                                    className="hidden md:flex h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center text-primary text-xs font-semibold cursor-pointer hover:bg-primary/20 transition-colors"
                                    title="Ir a mi Perfil"
                                >
                                    P
                                </Link>

                                {/* Logout Desktop — visible en sm+ */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => signOut({ callbackUrl: '/login' })}
                                    title="Cerrar sesión"
                                    className="hidden md:flex text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors h-9 w-9 rounded-xl border border-transparent hover:border-red-200 dark:hover:border-red-900/50"
                                >
                                    <LogOut size={17} />
                                </Button>
                            </>
                        ) : status === "unauthenticated" ? (
                            <Link href="/login" className="hidden sm:block">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 px-4 font-semibold text-sm border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50 transition-all rounded-xl"
                                >
                                    <LogIn size={16} className="mr-2" />
                                    Ingresar
                                </Button>
                            </Link>
                        ) : null}

                        {/* Hamburger — solo mobile */}
                        <button
                            className={cn(
                                "md:hidden p-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                                "text-foreground/70 hover:text-foreground hover:bg-muted"
                            )}
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-label={isMenuOpen ? "Cerrar menú" : "Abrir menú"}
                            aria-expanded={isMenuOpen}
                        >
                            {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── Mobile Navigation Drawer ── */}
            <div
                className={cn(
                    "fixed inset-0 z-40 md:hidden transition-all duration-300 ease-in-out",
                    "bg-background/97 backdrop-blur-xl",
                    isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
                )}
                aria-hidden={!isMenuOpen}
            >
                {/* Top bar placeholder para no solapar con el nav */}
                <div className="h-14 sm:h-16" />

                <div className="flex flex-col h-[calc(100%-3.5rem)] px-6 pt-6 pb-10">
                    <nav className="flex-1 flex flex-col gap-1">
                        {status === "authenticated" && navLinks.map(({ href, label, icon: Icon }) => (
                            <Link
                                key={href}
                                href={href}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3.5 rounded-xl text-lg font-semibold transition-all",
                                    pathname === href
                                        ? "bg-primary/10 text-primary"
                                        : "text-foreground/75 hover:text-foreground hover:bg-muted"
                                )}
                            >
                                <Icon size={22} />
                                {label}
                            </Link>
                        ))}
                    </nav>

                    {/* Bottom section del drawer */}
                    <div className="border-t border-border/50 pt-5 space-y-4">
                        {/* Theme selector full en mobile */}
                        <div className="flex flex-col gap-2">
                            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1">
                                Apariencia
                            </span>
                            <ThemeToggle variant="full" className="w-full justify-between" />
                        </div>

                        {status === "authenticated" ? (
                            <>
                                {/* Perfil en mobile */}
                                <Link href="/profile">
                                    <Button
                                        variant="outline"
                                        size="md"
                                        className="w-full text-sm"
                                        onClick={() => setIsMenuOpen(false)}
                                    >
                                        Mi Perfil
                                    </Button>
                                </Link>

                                {/* Nueva Inscripción solo para admins/teachers */}
                                {userRole !== "STUDENT" && (
                                    <Link href="/students/new" className="w-full">
                                        <Button
                                            variant="primary"
                                            size="md"
                                            className="premium-gradient w-full text-sm"
                                            onClick={() => setIsMenuOpen(false)}
                                        >
                                            + Nueva Inscripción
                                        </Button>
                                    </Link>
                                )}
                                <Button
                                    variant="outline"
                                    size="md"
                                    className="w-full text-sm text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:text-red-400 dark:border-red-900/50 dark:hover:bg-red-950/50 dark:hover:text-red-300"
                                    onClick={() => signOut({ callbackUrl: '/login' })}
                                >
                                    <LogOut size={18} className="mr-2" />
                                    Cerrar sesión
                                </Button>
                            </>
                        ) : status === "unauthenticated" ? (
                            <Link href="/login" className="w-full mt-4">
                                <Button
                                    variant="primary"
                                    size="md"
                                    className="premium-gradient w-full text-base font-bold h-12"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    <LogIn size={18} className="mr-2" />
                                    Iniciar Sesión
                                </Button>
                            </Link>
                        ) : null}
                    </div>
                </div>
            </div>
        </>
    );
}
