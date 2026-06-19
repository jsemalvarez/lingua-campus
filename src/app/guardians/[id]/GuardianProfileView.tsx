"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EditGuardianForm } from "./EditGuardianForm";
import { GuardianDangerZone } from "./GuardianDangerZone";
import { Mail, Phone, Edit3, UserCheck, GraduationCap } from "lucide-react";
import Link from "next/link";

interface StudentLink {
    student: {
        id: string;
        name: string;
    };
    relation: string | null;
}

interface GuardianData {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    guardianLinks: StudentLink[];
}

export function GuardianProfileView({ guardian }: { guardian: GuardianData }) {
    const [isEditing, setIsEditing] = useState(false);

    if (isEditing) {
        return (
            <div className="max-w-3xl mx-auto space-y-6">
                <EditGuardianForm guardian={guardian} onCancel={() => setIsEditing(false)} />
                <GuardianDangerZone guardianId={guardian.id} />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Main Profile Column */}
            <div className="md:col-span-1 space-y-6">
                <Card className="p-6 flex flex-col items-center text-center border-border/40 bg-card/50 relative overflow-hidden">
                    <div className="absolute top-0 w-full h-1 premium-gradient" />

                    <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-3xl shadow-sm mb-4">
                        {guardian.name.charAt(0).toUpperCase()}
                    </div>

                    <h2 className="text-xl font-bold capitalize">{guardian.name}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Tutor Legal
                    </p>

                    <Button variant="outline" className="w-full mt-6 shadow-sm font-semibold border-primary/20 hover:bg-primary/5 hover:text-primary" onClick={() => setIsEditing(true)}>
                        <Edit3 size={16} className="mr-2" /> Editar Perfil
                    </Button>
                </Card>

                <Card className="p-5 border-border/40 bg-card/50 space-y-4">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
                        <UserCheck size={16} /> Contacto
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                                <Mail size={16} />
                            </div>
                            <span className="text-sm font-medium">
                                {guardian.email}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                                <Phone size={16} />
                            </div>
                            <span className="text-sm font-medium">
                                {guardian.phone ? (
                                    <a href={`https://wa.me/${guardian.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-emerald-600 dark:text-emerald-400">
                                        {guardian.phone}
                                    </a>
                                ) : (
                                    <span className="text-muted-foreground italic">No registrado</span>
                                )}
                            </span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Additional Info / Students */}
            <div className="md:col-span-2 space-y-6">
                <Card className="p-6 border-border/40 shadow-sm leading-relaxed">
                    <h3 className="text-lg font-bold border-b border-border/40 pb-4 mb-4 text-foreground/90 flex items-center gap-2">
                        <GraduationCap className="text-primary" size={22} /> Estudiantes a Cargo
                    </h3>

                    {guardian.guardianLinks.length === 0 ? (
                        <div className="text-center py-6 bg-muted/10 rounded-xl border border-dashed border-border/40">
                            <p className="text-muted-foreground text-sm">Este tutor no está vinculado a ningún estudiante.</p>
                        </div>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {guardian.guardianLinks.map(link => (
                                <Link key={link.student.id} href={`/students/${link.student.id}`}>
                                    <div className="p-4 rounded-xl border border-border/50 bg-muted/30 hover:bg-primary/5 hover:border-primary/30 transition-colors group cursor-pointer h-full flex flex-col justify-center">
                                        <h4 className="font-bold text-[15px] group-hover:text-primary transition-colors capitalize">
                                            {link.student.name}
                                        </h4>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
}
