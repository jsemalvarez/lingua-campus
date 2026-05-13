"use client";

import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { 
    FileSpreadsheet, 
    Download, 
    Printer, 
    ArrowLeft,
    Users,
    ChevronDown
} from "lucide-react";
import Link from "next/link";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface StudentData {
    id: string;
    name: string;
    dni: string | null;
    birthDate: Date | null;
    age: number | null;
    schoolInfo: string | null;
    guardian1Name: string | null;
    guardian1Phone: string | null;
}

interface CourseGroup {
    courseName: string;
    students: StudentData[];
}

interface SpreadsheetViewProps {
    data: CourseGroup[];
    activeRole: string;
    instituteName: string;
}

export function SpreadsheetView({ data, activeRole, instituteName }: SpreadsheetViewProps) {
    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        
        doc.setFontSize(20);
        doc.text(`Planilla de Alumnos - ${instituteName}`, 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Generado el: ${new Date().toLocaleDateString('es-AR')}`, 14, 30);

        let startY = 40;

        data.forEach((group) => {
            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.text(group.courseName, 14, startY);
            
            autoTable(doc, {
                startY: startY + 5,
                head: [['Nombre', 'DNI', 'F. Nac.', 'Edad', 'Colegio/Turno', 'Tutor Legal']],
                body: group.students.map(s => [
                    s.name,
                    s.dni || '-',
                    s.birthDate ? new Date(s.birthDate).toLocaleDateString('es-AR') : '-',
                    s.age?.toString() || '-',
                    s.schoolInfo || '-',
                    s.guardian1Name ? `${s.guardian1Name} ${s.guardian1Phone ? `(${s.guardian1Phone})` : ''}` : '-'
                ]),
                theme: 'striped',
                headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
                margin: { left: 14 },
            });
            
            startY = (doc as any).lastAutoTable.finalY + 15;
        });

        doc.save(`Planilla_Alumnos_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const totalStudents = data.reduce((acc, curr) => acc + curr.students.length, 0);

    return (
        <div className="min-h-screen bg-background pb-20 print:bg-white print:pb-0">
            <div className="print:hidden">
                <Navbar currentActiveRole={activeRole} />
            </div>

            <main className="container mx-auto px-4 sm:px-6 py-8 space-y-8">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
                    <div className="space-y-1">
                        <Link 
                            href="/courses" 
                            className="text-sm font-medium text-primary hover:underline flex items-center gap-1 mb-2 w-fit transition-all hover:gap-2"
                        >
                            <ArrowLeft size={14} /> Volver a Cursos
                        </Link>
                        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 rounded-xl">
                                <FileSpreadsheet className="text-emerald-500" size={28} />
                            </div>
                            Planilla de Alumnos
                        </h1>
                        <p className="text-muted-foreground flex items-center gap-2">
                            <Users size={16} /> {totalStudents} alumnos registrados en total
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Button 
                            onClick={handleDownloadPDF}
                            className="h-11 px-6 shadow-lg shadow-primary/20 premium-gradient border-none hover:opacity-90 font-bold transition-all hover:scale-[1.02] flex items-center gap-2 text-white"
                        >
                            <Download size={18} /> Descargar PDF
                        </Button>
                    </div>
                </div>

                {/* Print-only header */}
                <div className="hidden print:block text-center space-y-2 mb-8 border-b pb-6">
                    <h1 className="text-4xl font-bold">{instituteName}</h1>
                    <h2 className="text-2xl text-gray-600">Planilla de Alumnos</h2>
                    <p className="text-sm text-gray-500">Fecha de generación: {new Date().toLocaleDateString('es-AR')}</p>
                </div>

                {/* Table Section */}
                <div className="space-y-10">
                    {data.length === 0 ? (
                        <div className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border/60">
                            <Users className="mx-auto text-muted-foreground mb-4" size={48} />
                            <h2 className="text-xl font-bold">No hay alumnos para mostrar</h2>
                            <p className="text-muted-foreground mt-2">Asegúrate de que los alumnos estén inscritos en cursos activos.</p>
                        </div>
                    ) : (
                        data.map((group, idx) => (
                            <div key={idx} className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: `${idx * 100}ms` }}>
                                <div className="flex items-center gap-3 border-b border-border/40 pb-2">
                                    <div className="h-2 w-2 rounded-full bg-primary" />
                                    <h2 className="text-xl font-bold tracking-tight text-foreground/90 uppercase">
                                        {group.courseName}
                                    </h2>
                                    <span className="text-sm font-medium bg-muted px-2.5 py-0.5 rounded-full text-muted-foreground">
                                        {group.students.length} alumnos
                                    </span>
                                </div>

                                <Card className="overflow-hidden border-none shadow-xl shadow-black/5 bg-background/50 glass">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-muted/30 border-b border-border/50">
                                                    <th className="px-6 py-4 text-sm font-semibold text-foreground/70 uppercase tracking-wider">Nombre del Alumno</th>
                                                    <th className="px-6 py-4 text-sm font-semibold text-foreground/70 uppercase tracking-wider text-center">Edad</th>
                                                    <th className="px-6 py-4 text-sm font-semibold text-foreground/70 uppercase tracking-wider">DNI</th>
                                                    <th className="px-6 py-4 text-sm font-semibold text-foreground/70 uppercase tracking-wider">Colegio/Turno</th>
                                                    <th className="px-6 py-4 text-sm font-semibold text-foreground/70 uppercase tracking-wider">Tutor Legal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-border/40">
                                                {group.students.map((student) => (
                                                    <tr key={student.id} className="hover:bg-primary/5 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-foreground/90 group-hover:text-primary transition-colors">
                                                                {student.name}
                                                            </div>
                                                            <div className="text-[10px] text-muted-foreground mt-0.5">
                                                                F. Nac: {student.birthDate ? new Date(student.birthDate).toLocaleDateString('es-AR') : 'N/A'}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4 text-center">
                                                            {student.age !== null ? (
                                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs">
                                                                    {student.age}
                                                                </span>
                                                            ) : (
                                                                <span className="italic text-muted-foreground/40 text-[10px]">N/A</span>
                                                            )}
                                                        </td>
                                                        <td className="px-6 py-4 text-muted-foreground font-mono text-sm">
                                                            {student.dni || '-'}
                                                        </td>
                                                        <td className="px-6 py-4 text-muted-foreground text-sm">
                                                            {student.schoolInfo || '-'}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {student.guardian1Name ? (
                                                                <div className="flex flex-col">
                                                                    <span className="text-sm font-medium text-foreground/80">{student.guardian1Name}</span>
                                                                    {student.guardian1Phone && (
                                                                        <span className="text-[10px] text-muted-foreground">{student.guardian1Phone}</span>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="text-muted-foreground/40 text-xs">-</span>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </Card>
                            </div>
                        ))
                    )}
                </div>
            </main>
        </div>
    );
}
