"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EditStudentForm } from "./EditStudentForm";
import { Mail, Phone, User, UserCheck, Edit3, Info } from "lucide-react";
import dayjs from "dayjs";
import { StudentDangerZone } from "./StudentDangerZone";

interface StudentData {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    joinDate: Date;
    guardian1Name: string | null;
    guardian1Relation: string | null;
    guardian1Phone: string | null;
    guardian2Name: string | null;
    guardian2Relation: string | null;
    guardian2Phone: string | null;
    birthDate: Date | null;
    address: string | null;
    dni: string | null;
    schoolInfo: string | null;
    registeredLevel: string | null;
}

export function StudentProfileView({ student, userRole }: { student: StudentData; userRole: string }) {
    const [isEditing, setIsEditing] = useState(false);

    if (isEditing) {
        return (
            <div className="max-w-3xl mx-auto">
                <EditStudentForm student={student} onCancel={() => setIsEditing(false)} />
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Columna Izquierda: Perfíl Principal */}
            <div className="md:col-span-1 space-y-6">
                <Card className="p-6 flex flex-col items-center text-center border-border/40 bg-card/50 relative overflow-hidden">
                    <div className="absolute top-0 w-full h-1 premium-gradient" />

                    <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-3xl shadow-sm mb-4">
                        {student.name.charAt(0).toUpperCase()}
                    </div>

                    <h2 className="text-xl font-bold capitalize">{student.name}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Ingresó el {dayjs(student.joinDate).format("DD MMM, YYYY")}
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
                                {student.email || <span className="text-muted-foreground italic">No registrado</span>}
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                                <Phone size={16} />
                            </div>
                            <span className="text-sm font-medium">
                                {student.phone || <span className="text-muted-foreground italic">No registrado</span>}
                            </span>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Columna Derecha: Información Adicional y Tutores */}
            <div className="md:col-span-2 space-y-6">
                <Card className="p-6 border-border/40 shadow-sm leading-relaxed">
                    <h3 className="text-lg font-bold flex items-center gap-2 border-b border-border/40 pb-4 mb-4 text-foreground/90">
                        <Info className="text-primary" /> Información Adicional
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-5">
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">DNI</span>
                            <p className="font-medium text-sm">{student.dni || "-"}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Fecha de Nacimiento</span>
                            <p className="font-medium text-sm">
                                {student.birthDate ? `${dayjs(student.birthDate).format("DD/MM/YYYY")} (${dayjs().diff(student.birthDate, 'year')} años)` : "-"}
                            </p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Domicilio</span>
                            <p className="font-medium text-sm capitalize">{student.address || "-"}</p>
                        </div>
                        <div className="space-y-1">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Colegio / Turno</span>
                            <p className="font-medium text-sm capitalize">{student.schoolInfo || "-"}</p>
                        </div>
                        <div className="space-y-1 sm:col-span-2">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">Nivel Inscripto (Censo Inicial)</span>
                            <p className="font-medium text-sm capitalize">{student.registeredLevel || "-"}</p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 border-border/40 shadow-sm leading-relaxed">
                    <h3 className="text-lg font-bold flex items-center gap-2 border-b border-border/40 pb-4 mb-4 text-foreground/90">
                        <UserCheck className="text-primary" /> Tutores Legales
                    </h3>

                    <div className="grid sm:grid-cols-2 gap-6">
                        <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border/50">
                            <div className="font-semibold text-sm flex items-center gap-2 text-primary">
                                <User size={16} /> Tutor Principal
                            </div>
                            {student.guardian1Name ? (
                                <>
                                    <div className="text-sm">
                                        <span className="text-muted-foreground block text-xs uppercase mb-0.5 tracking-wider font-semibold">Nombre y Relación</span>
                                        <span className="font-medium capitalize">{student.guardian1Name}</span>
                                        {student.guardian1Relation && <span className="text-muted-foreground ml-1 capitalize">({student.guardian1Relation})</span>}
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-muted-foreground block text-xs uppercase mb-0.5 tracking-wider font-semibold">Celular</span>
                                        <span className="font-medium">{student.guardian1Phone || "-"}</span>
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm italic text-muted-foreground">Sin datos registrados.</p>
                            )}
                        </div>

                        <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border/50">
                            <div className="font-semibold text-sm flex items-center gap-2 text-foreground/80">
                                <User size={16} /> Tutor Secundario
                            </div>
                            {student.guardian2Name ? (
                                <>
                                    <div className="text-sm">
                                        <span className="text-muted-foreground block text-xs uppercase mb-0.5 tracking-wider font-semibold">Nombre y Relación</span>
                                        <span className="font-medium capitalize">{student.guardian2Name}</span>
                                        {student.guardian2Relation && <span className="text-muted-foreground ml-1 capitalize">({student.guardian2Relation})</span>}
                                    </div>
                                    <div className="text-sm">
                                        <span className="text-muted-foreground block text-xs uppercase mb-0.5 tracking-wider font-semibold">Celular</span>
                                        <span className="font-medium">{student.guardian2Phone || "-"}</span>
                                    </div>
                                </>
                            ) : (
                                <p className="text-sm italic text-muted-foreground">Opcional. Sin datos registrados.</p>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Danger Zone */}
            {(userRole === "ADMIN" || userRole === "SUPERADMIN") && (
                <div className="md:col-span-3">
                    <StudentDangerZone studentId={student.id} />
                </div>
            )}
        </div>
    );
}
