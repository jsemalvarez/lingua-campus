"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LayoutDashboard, Users, GraduationCap, DollarSign, Clock, BookOpen, LogOut, LogIn, UserCircle, Settings, HelpCircle, Brain, Mail } from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { useTenant } from "@/components/providers/TenantProvider";
import Image from "next/image";
import { NotificationBell } from "@/components/layout/NotificationBell";
import { MessagesBell } from "@/components/layout/MessagesBell";
import { RoleSwitcher } from "@/components/layout/RoleSwitcher";

/**
 * Premium dashboard navigation bar.
 * Desktop: top sticky bar with logo + links + actions.
 * Mobile: simplified top bar (logo + theme + profile) + fixed bottom tab bar with icons.
 */
export function Navbar({ 
    className,
    currentActiveRole
}: { 
    className?: string;
    currentActiveRole?: string;
}) {
    const pathname = usePathname();
    const { data: session, status } = useSession();
    const tenant = useTenant();

    const brandName = tenant ? tenant.name : "Lingua Campus";
    const primaryColor = "#4F46E5";

    const sessionUser = session?.user as any;
    const userRoleLegacy = sessionUser?.role || "TEACHER";
    const userRoles = sessionUser?.roles || [userRoleLegacy];
    
    // Si no viene el rol activo por prop, buscamos en cookies (Client side) o por defecto
    const [activeRole, setActiveRole] = React.useState(currentActiveRole || userRoles[0]);

    React.useEffect(() => {
        if (!currentActiveRole) {
            const roleCookie = document.cookie
                .split("; ")
                .find((row) => row.startsWith("lingua_current_role="))
                ?.split("=")[1];
            if (roleCookie && userRoles.includes(roleCookie)) {
                setActiveRole(roleCookie);
            }
        } else {
            setActiveRole(currentActiveRole);
        }
    }, [currentActiveRole, userRoles]);

    // /messages is shown as an icon in the right-side actions area (desktop) and in the bottom tab (mobile).
    // It is intentionally excluded from allNavLinks to avoid appearing in the left desktop nav.
    const allNavLinks = [
        { href: "/dashboard", label: "Resumen", icon: LayoutDashboard, roles: ["ADMIN", "TEACHER", "STUDENT", "GUARDIAN", "SECRETARY", "SUPERADMIN"] },
        { href: "/academics", label: "Progreso", icon: GraduationCap, roles: ["STUDENT"] },
        { href: "/practice", label: "Práctica", icon: Brain, roles: ["STUDENT"] },
        { href: "/administration", label: "Administración", icon: DollarSign, roles: ["STUDENT"] },
        { href: "/teachers", label: "Personal", icon: GraduationCap, roles: ["ADMIN", "SUPERADMIN"] },
        { href: "/students", label: "Estudiantes", icon: Users, roles: ["ADMIN", "SECRETARY", "TEACHER", "SUPERADMIN"] },
        { href: "/courses", label: "Cursos", icon: BookOpen, roles: ["ADMIN", "TEACHER", "SECRETARY", "SUPERADMIN"] },
        { href: "/schedule", label: "Calendario", icon: Clock, roles: ["ADMIN", "TEACHER", "SECRETARY", "SUPERADMIN"] },
        { href: "/guardian/academics", label: "Progreso", icon: GraduationCap, roles: ["GUARDIAN"] },
        { href: "/guardian/payments", label: "Administración", icon: DollarSign, roles: ["GUARDIAN"] },
        { href: "/payments", label: "Finanzas", icon: DollarSign, roles: ["ADMIN", "SECRETARY", "SUPERADMIN"] },
        { href: "/dashboard/settings/institute", label: "Configurar", icon: Settings, roles: ["ADMIN", "SUPERADMIN"] },
    ];

    // Mobile bottom tab uses the same links as desktop (no /messages — it's in the top bar)
    const allNavLinksMobile = [...allNavLinks];

    // Calcular edad si es estudiante
    let isMinor = true;
    if (activeRole === "STUDENT") {
        if (sessionUser?.birthDate) {
            const birthDate = new Date(sessionUser.birthDate);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            isMinor = age < 18;
        }
    } else {
        isMinor = false;
    }

    const navLinks = allNavLinks.filter(link => {
        if ((link.href === "/payments" || link.href === "/administration") && activeRole === "STUDENT" && isMinor) return false;
        return link.roles.includes(activeRole);
    });

    const mobileNavLinks = allNavLinksMobile.filter(link => {
        if ((link.href === "/payments" || link.href === "/administration") && activeRole === "STUDENT" && isMinor) return false;
        return link.roles.includes(activeRole);
    });

    return (
        <>
            {/* TOP NAVBAR */}
            <nav className={cn("sticky top-0 z-50 w-full glass border-b border-border/50", className)}>
                <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">

                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center gap-2 group shrink-0">
                        <div className="h-7 w-7 sm:h-8 sm:w-8 premium-gradient rounded-lg flex items-center justify-center text-white font-bold text-sm group-hover:scale-105 transition-transform shadow-sm">
                            {brandName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground/90 group-hover:text-primary transition-colors">
                            {brandName.split(' ')[0]} <span className="text-primary hidden sm:inline">{brandName.split(' ').slice(1).join(' ')}</span>
                        </span>
                    </Link>

                    {/* Desktop nav links */}
                    {status === "authenticated" && (
                        <div className="hidden md:flex items-center gap-1">
                            {navLinks.map(({ href, label, icon: Icon }) => {
                                const isActive = pathname.startsWith(href) && href !== "/dashboard" || (pathname === "/dashboard" && href === "/dashboard");
                                return (
                                    <Link
                                        key={href}
                                        href={href}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-150",
                                            isActive
                                                ? "bg-primary/10 text-primary"
                                                : "text-foreground/65 hover:text-foreground hover:bg-muted"
                                        )}
                                        title={label}
                                    >
                                        <Icon size={18} className="lg:w-4 lg:h-4" />
                                        <span className="hidden lg:inline">{label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    {/* Right side actions */}
                    <div className="flex items-center gap-2 sm:gap-3">
                        <ThemeToggle variant="icon" />

                        {status === "authenticated" ? (
                            <>
                                {/* Selector de Roles - Nuevo */}
                                <RoleSwitcher 
                                    currentRole={activeRole} 
                                    availableRoles={userRoles} 
                                />

                                {sessionUser?.id && (
                                    <>
                                        <MessagesBell
                                            userId={sessionUser.id}
                                            isStudent={userRoles.includes("STUDENT")}
                                            instituteId={sessionUser.instituteId ?? ""}
                                            isAdmin={userRoles.some((r: string) => ["ADMIN", "SECRETARY", "SUPERADMIN"].includes(r))}
                                            variant="icon"
                                            isActive={pathname.startsWith("/messages")}
                                        />
                                        <NotificationBell
                                            userId={sessionUser.id}
                                            isStudent={userRoles.includes("STUDENT")}
                                        />
                                    </>
                                )}

                                {(activeRole === "ADMIN" || activeRole === "SECRETARY" || activeRole === "SUPERADMIN") && (
                                    <Link href="/dashboard/help"
                                        className="flex h-8 w-8 sm:h-9 sm:w-9 rounded-xl items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors border border-transparent hover:border-primary/20"
                                        title="Centro de Ayuda"
                                    >
                                        <HelpCircle size={20} />
                                    </Link>
                                )}

                                <Link href="/profile"
                                    className="flex h-8 w-8 sm:h-9 sm:w-9 rounded-xl items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors border border-transparent hover:border-primary/20"
                                    title="Mi Perfil"
                                >
                                    <UserCircle size={20} />
                                </Link>

                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => signOut({ callbackUrl: '/login' })}
                                    className="text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 h-8 w-8 sm:h-9 sm:w-9 rounded-xl transition-colors"
                                >
                                    <LogOut size={17} />
                                </Button>
                            </>
                        ) : status === "unauthenticated" ? (
                            <Link href="/login" className="hidden sm:block">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 px-4 font-semibold text-sm border-primary/30 text-primary hover:bg-primary/10 rounded-xl"
                                >
                                    <LogIn size={16} className="mr-2" />
                                    Ingresar
                                </Button>
                            </Link>
                        ) : null}
                    </div>
                </div>
            </nav>

            {/* MOBILE BOTTOM TAB BAR */}
            {status === "authenticated" && (
                <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass border-t border-border/50 safe-area-bottom">
                    <div className="flex items-center justify-around h-14 px-2">
                        {mobileNavLinks.map(({ href, label, icon: Icon }) => {
                            const isActive = pathname === href || (pathname.startsWith(href) && href !== "/dashboard");
                            if (href === "/messages" && sessionUser?.id) {
                                return (
                                    <MessagesBell
                                        key={href}
                                        userId={sessionUser.id}
                                        isStudent={userRoles.includes("STUDENT")}
                                        instituteId={sessionUser.instituteId ?? ""}
                                        isAdmin={userRoles.some((r: string) => ["ADMIN", "SECRETARY", "SUPERADMIN"].includes(r))}
                                        variant="mobile"
                                        isActive={isActive}
                                        label={label}
                                    />
                                );
                            }
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={cn(
                                        "flex items-center justify-center flex-1 py-1 rounded-xl transition-all",
                                        isActive ? "text-primary" : "text-foreground/40 hover:text-foreground/60"
                                    )}
                                >
                                    <div className={cn(
                                        "flex flex-col items-center justify-center w-12 h-10 rounded-xl transition-all",
                                        isActive && "bg-primary/5"
                                    )}>
                                        <Icon size={20} className="mb-0.5" />
                                        <span className="text-[10px] font-bold uppercase tracking-tight">{label.charAt(0)}</span>
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
