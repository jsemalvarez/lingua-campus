"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LayoutDashboard, Users, GraduationCap, DollarSign, Clock, BookOpen, LogOut, LogIn, UserCircle } from "lucide-react";
import { signOut, useSession } from "next-auth/react";

/**
 * Premium dashboard navigation bar.
 * Desktop: top sticky bar with logo + links + actions.
 * Mobile: simplified top bar (logo + theme + profile) + fixed bottom tab bar with icons.
 */
export function Navbar({ className }: { className?: string }) {
    const pathname = usePathname();
    const { data: session, status } = useSession();

    const allNavLinks = [
        { href: "/dashboard", label: "Resumen", icon: LayoutDashboard, roles: ["ADMIN", "TEACHER", "STUDENT"] },
        { href: "/teachers", label: "Profesores", icon: GraduationCap, roles: ["ADMIN"] },
        { href: "/students", label: "Estudiantes", icon: Users, roles: ["ADMIN", "TEACHER"] },
        { href: "/courses", label: "Cursos", icon: BookOpen, roles: ["ADMIN", "TEACHER"] },
        { href: "/schedule", label: "Calendario", icon: Clock, roles: ["ADMIN", "TEACHER", "STUDENT"] },
        { href: "/payments", label: "Pagos", icon: DollarSign, roles: ["ADMIN", "STUDENT"] },
    ];

    const userRole = (session?.user as any)?.role || "TEACHER"; // Default fallback
    const navLinks = allNavLinks.filter(link => link.roles.includes(userRole));

    return (
        <>
            {/* ══════════════════════════════════════════════
                TOP NAVBAR — visible en todas las resoluciones
               ══════════════════════════════════════════════ */}
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
                            {navLinks.map(({ href, label, icon: Icon }) => (
                                <Link
                                    key={href}
                                    href={href}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
                                        pathname === href
                                            ? "bg-primary/10 text-primary"
                                            : "text-foreground/65 hover:text-foreground hover:bg-muted"
                                    )}
                                    title={label}
                                >
                                    <Icon size={18} className="lg:w-4 lg:h-4" />
                                    <span className="hidden lg:inline">{label}</span>
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
                                {/* Perfil — siempre visible */}
                                <Link href="/profile"
                                    className="flex h-8 w-8 sm:h-9 sm:w-9 rounded-xl items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                                    title="Ir a mi Perfil"
                                >
                                    <UserCircle size={20} />
                                </Link>

                                {/* Logout — siempre visible */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => signOut({ callbackUrl: '/login' })}
                                    title="Cerrar sesión"
                                    className="text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors h-8 w-8 sm:h-9 sm:w-9 rounded-xl border border-transparent hover:border-red-200 dark:hover:border-red-900/50"
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
                    </div>
                </div>
            </nav>

            {/* ══════════════════════════════════════════════
                MOBILE BOTTOM TAB BAR — solo visible en < md
               ══════════════════════════════════════════════ */}
            {status === "authenticated" && (
                <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass border-t border-border/50 safe-area-bottom">
                    <div className="flex items-center justify-around h-14 px-2">
                        {navLinks.map(({ href, label, icon: Icon }) => {
                            const isActive = pathname === href;
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    title={label}
                                    className={cn(
                                        "flex items-center justify-center flex-1 py-2 rounded-xl transition-all duration-150",
                                        isActive
                                            ? "text-primary"
                                            : "text-foreground/50 active:text-foreground/80"
                                    )}
                                >
                                    <div className={cn(
                                        "flex items-center justify-center w-10 h-10 rounded-full transition-all duration-200",
                                        isActive && "bg-primary/10 scale-110"
                                    )}>
                                        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </>
    );
}
