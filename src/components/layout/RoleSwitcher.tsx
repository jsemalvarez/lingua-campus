"use client";

import { useState, useTransition } from "react";
import { 
    ChevronDown, 
    ShieldCheck, 
    UserRound, 
    BookOpenText, 
    ShieldAlert,
    Check
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { switchRoleAction } from "@/app/actions/roles";
import { cn } from "@/lib/utils";

interface Props {
    currentRole: string;
    availableRoles: string[];
}

const ROLE_LABELS: Record<string, { label: string, icon: any, color: string }> = {
    ADMIN: { label: "Administrador", icon: ShieldCheck, color: "text-blue-600" },
    SUPERADMIN: { label: "Super Admin", icon: ShieldAlert, color: "text-red-600" },
    TEACHER: { label: "Profesor", icon: BookOpenText, color: "text-purple-600" },
    SECRETARY: { label: "Secretaría", icon: UserRound, color: "text-orange-600" },
    GUARDIAN: { label: "Tutor / Padre", icon: UserRound, color: "text-emerald-600" },
    STUDENT: { label: "Estudiante", icon: UserRound, color: "text-slate-600" },
};

export function RoleSwitcher({ currentRole, availableRoles }: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    if (availableRoles.length <= 1) return null;

    const handleSwitch = (role: string) => {
        if (role === currentRole) {
            setIsOpen(false);
            return;
        }
        startTransition(async () => {
            await switchRoleAction(role);
            setIsOpen(false);
        });
    };

    const currentRoleData = ROLE_LABELS[currentRole] || { label: currentRole, icon: UserRound, color: "text-primary" };
    const Icon = currentRoleData.icon;

    return (
        <div className="relative">
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="h-9 px-3 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary font-bold rounded-xl gap-2 transition-all shadow-sm"
                disabled={isPending}
            >
                <Icon size={16} />
                <span className="hidden sm:inline">Modo {currentRoleData.label}</span>
                <ChevronDown className={cn("transition-transform duration-200", isOpen && "rotate-180")} size={14} />
            </Button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border/60 shadow-xl rounded-2xl z-50 py-2 animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-4 py-2 text-[11px] font-bold text-muted-foreground uppercase tracking-widest border-b border-border/40 mb-1">
                            Cambiar a Vista:
                        </div>
                        {availableRoles.map((role) => {
                            const data = ROLE_LABELS[role] || { label: role, icon: UserRound, color: "text-muted-foreground" };
                            const RoleIcon = data.icon;
                            const isActive = role === currentRole;

                            return (
                                <button
                                    key={role}
                                    onClick={() => handleSwitch(role)}
                                    disabled={isPending}
                                    className={cn(
                                        "w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-muted/50 text-left group",
                                        isActive ? "bg-primary/5 font-bold text-primary" : "text-foreground/80"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "p-1.5 rounded-lg bg-muted/40 group-hover:bg-background transition-colors",
                                            isActive && "bg-primary/10"
                                        )}>
                                            <RoleIcon size={16} className={data.color} />
                                        </div>
                                        {data.label}
                                    </div>
                                    {isActive && <Check size={16} className="text-primary" />}
                                </button>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}
