"use client";

import * as React from "react";
import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cn } from "@/lib/utils";

interface PublicNavbarProps {
    instituteName: string;
    landingUrl?: string;
    className?: string;
}

export function PublicNavbar({ instituteName, landingUrl = "/", className }: PublicNavbarProps) {
    return (
        <nav
            className={cn(
                "sticky top-0 z-50 w-full bg-primary/10 border-b border-border/50 backdrop-blur-md",
                className
            )}
        >
            <div className="container mx-auto flex h-14 sm:h-16 items-center justify-between px-4 sm:px-6">

                {/* ── Logo & Institute Name ── */}
                <Link href={landingUrl} className="flex items-center gap-2 group shrink-0">
                    <div className="h-7 w-7 sm:h-8 sm:w-8 premium-gradient rounded-lg flex items-center justify-center text-white font-bold text-sm group-hover:scale-105 transition-transform">
                        <GraduationCap size={16} />
                    </div>
                    <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground/90 group-hover:text-primary transition-colors">
                        {instituteName}
                    </span>
                </Link>

                {/* ── Right side actions ── */}
                <div className="flex items-center gap-3">
                    <ThemeToggle variant="icon" />

                    {/* Optional: Add a simple Link or Button if needed later (e.g. Login) */}
                </div>
            </div>
        </nav>
    );
}
