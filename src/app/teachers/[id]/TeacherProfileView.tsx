"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EditTeacherForm } from "./EditTeacherForm";
import { Mail, Phone, Edit3, AlertTriangle } from "lucide-react";
import { TeacherDangerZone } from "./TeacherDangerZone";

interface TeacherData {
    id: string;
    name: string;
    email: string;
    phone: string | null;
}

export function TeacherProfileView({ teacher }: { teacher: TeacherData }) {
    const [isEditing, setIsEditing] = useState(false);

    if (isEditing) {
        return (
            <div className="max-w-3xl mx-auto">
                <EditTeacherForm teacher={teacher} onCancel={() => setIsEditing(false)} />
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
                        {teacher.name.charAt(0).toUpperCase()}
                    </div>

                    <h2 className="text-xl font-bold capitalize">{teacher.name}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Profesor / Docente
                    </p>

                    <Button variant="outline" className="w-full mt-6 shadow-sm font-semibold border-primary/20 hover:bg-primary/5 hover:text-primary" onClick={() => setIsEditing(true)}>
                        <Edit3 size={16} className="mr-2" /> Editar Perfil
                    </Button>
                </Card>

                <Card className="p-5 border-border/40 bg-card/50 space-y-4">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">
                        Contacto Personal
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                                <Mail size={16} />
                            </div>
                            <span className="text-sm font-medium">
                                {teacher.email}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                                <Phone size={16} />
                            </div>
                            <span className="text-sm font-medium">
                                {teacher.phone ? (
                                    <a href={`https://wa.me/${teacher.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="hover:underline text-emerald-600 dark:text-emerald-400">
                                        {teacher.phone}
                                    </a>
                                ) : (
                                    <span className="text-muted-foreground italic">No registrado</span>
                                )}
                            </span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Additional Info / Future Content */}
            <div className="md:col-span-2 space-y-6">
                <Card className="p-6 border-border/40 shadow-sm leading-relaxed">
                    <h3 className="text-lg font-bold border-b border-border/40 pb-4 mb-4 text-foreground/90">
                        Información del Docente
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Aquí se pueden agregar más campos específicos para profesores, como especialidades, disponibilidad o historial.
                    </p>
                </Card>
            </div>
        </div>
    );
}
