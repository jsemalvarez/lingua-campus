"use client";

import React, { useState, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { 
  ClipboardList, 
  Calendar, 
  FileDown, 
  MessageSquare, 
  CheckCircle, 
  Award,
  Sparkles,
  Lock
} from "lucide-react";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface StudentReportViewerProps {
  studentName: string;
  reports: any[];
  instituteName?: string;
}

export function StudentReportViewer({ studentName, reports, instituteName }: StudentReportViewerProps) {
  // Group reports by course
  const reportsByCourse = useMemo(() => {
    const groups: { [courseId: string]: any[] } = {};
    reports.forEach((report) => {
      const cId = report.courseId;
      if (!groups[cId]) {
        groups[cId] = [];
      }
      groups[cId].push(report);
    });
    return groups;
  }, [reports]);

  const courseIds = Object.keys(reportsByCourse);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(courseIds[0] || "");

  // If course changed, reset period
  const courseReports = reportsByCourse[selectedCourseId] || [];
  const latestReport = courseReports[0]; // ordered desc by year, periodIndex asc/desc?
  
  // Find all unique periods for the selected course based on the template
  const periodLabels = latestReport?.template?.periodLabels || [];
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState<number>(
    latestReport ? latestReport.periodIndex : 0
  );

  // Active report based on selected course and period
  const activeReport = courseReports.find(
    (r) => r.periodIndex === selectedPeriodIndex
  );

  // Fallback to first available report if selected period is not active/available
  const displayedReport = activeReport || latestReport;

  // Sync state if selected course has no report for the selected period
  React.useEffect(() => {
    if (courseReports.length > 0 && !courseReports.some(r => r.periodIndex === selectedPeriodIndex)) {
      setSelectedPeriodIndex(courseReports[0].periodIndex);
    }
  }, [selectedCourseId, courseReports, selectedPeriodIndex]);

  if (reports.length === 0) {
    return (
      <Card className="p-10 border-none shadow-2xl bg-card rounded-[3rem] relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-700">
          <ClipboardList size={200} />
        </div>
        <div className="relative z-10 text-center max-w-2xl mx-auto space-y-6">
          <div className="w-16 h-16 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="text-primary" size={32} />
          </div>
          <h2 className="text-3xl font-black tracking-tight">Informe Trimestral</h2>
          <p className="text-muted-foreground font-medium leading-relaxed">
            Actualmente no hay informes académicos publicados para ti. 
            Tan pronto como tus profesores completen y publiquen las evaluaciones, aparecerán aquí.
          </p>
          <div className="pt-6 border-t border-border/50">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-muted/30 rounded-full text-sm font-bold text-muted-foreground border border-dashed border-muted-foreground/30">
              <Lock size={16} /> Próximamente disponible
            </div>
          </div>
        </div>
        <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      </Card>
    );
  }

  const activeCourseInfo = displayedReport?.course;
  const categories = displayedReport?.template?.categories || [];
  const entries = displayedReport?.entries || [];
  const specialFields = displayedReport?.template?.specialFields as any || {};

  const handleDownloadPDF = () => {
    if (!displayedReport) return;

    const doc = new jsPDF();
    const courseName = displayedReport.course?.level || displayedReport.course?.name || "Curso";
    const periodLabel = periodLabels[displayedReport.periodIndex] || `${displayedReport.periodIndex + 1}° Período`;
    const reportYear = displayedReport.year;

    // Header Design
    doc.setFillColor(56, 179, 151); // Client primary color #38b397
    doc.rect(0, 0, 210, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    const displayName = (instituteName || "LINGUA CAMPUS").toUpperCase();
    doc.text(displayName, 14, 20);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Reporte de Rendimiento Académico Oficial", 14, 28);

    // Student Info Panel
    doc.setTextColor(51, 65, 85);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("ESTUDIANTE:", 14, 55);
    doc.setFont("helvetica", "normal");
    doc.text(studentName.toUpperCase(), 48, 55);

    doc.setFont("helvetica", "bold");
    doc.text("CURSO:", 14, 62);
    doc.setFont("helvetica", "normal");
    doc.text(courseName.toUpperCase(), 48, 62);

    doc.setFont("helvetica", "bold");
    doc.text("DOCENTE:", 14, 69);
    doc.setFont("helvetica", "normal");
    doc.text((activeCourseInfo?.teacher?.name || "No asignado").toUpperCase(), 48, 69);

    doc.setFont("helvetica", "bold");
    doc.text("PERÍODO:", 14, 76);
    doc.setFont("helvetica", "normal");
    doc.text(`${periodLabel} - ${reportYear}`, 48, 76);



    // Divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(14, 89, 196, 89);

    // Table Data
    const tableRows = categories.map((cat: any) => {
      const entry = entries.find((e: any) => e.categoryId === cat.id);
      let val = entry?.value || "-";
      let scaleDesc = "";

      if (cat.scaleType === "CONCEPTUAL" || cat.scaleType === "LETTER") {
        // Only display the value, not the label, to maintain consistency with custom options
      } else if (cat.scaleType === "NUMERIC") {
        // Scale description omitted per request
      }

      return [cat.name, val + scaleDesc];
    });

    autoTable(doc, {
      startY: 95,
      head: [["Criterio de Evaluación", "Calificación / Estado"]],
      body: tableRows,
      headStyles: { fillColor: [56, 179, 151], fontStyle: "bold" },
      theme: "striped",
      styles: { fontSize: 10, cellPadding: 5 },
    });

    let currentY = (doc as any).lastAutoTable.finalY + 15;

    // Comments Section
    if (specialFields.teacherComments && displayedReport.teacherComments) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Comentarios del Profesor:", 14, currentY);
      currentY += 6;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(10);
      const splitText = doc.splitTextToSize(displayedReport.teacherComments, 180);
      doc.text(splitText, 14, currentY);
      currentY += (splitText.length * 5) + 15;
    }

    // Signatures
    if (currentY > 260) {
      doc.addPage();
      currentY = 30;
    }

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(14, currentY, 80, currentY);
    doc.line(130, currentY, 196, currentY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`Prof. ${activeCourseInfo?.teacher?.name || "Docente"}`, 35, currentY + 5, { align: "center" });
    doc.text("Firma de la Institución", 163, currentY + 5, { align: "center" });

    // Save
    doc.save(`boletin_${studentName.replace(/\s+/g, "_").toLowerCase()}_${courseName.replace(/\s+/g, "_").toLowerCase()}_p${displayedReport.periodIndex + 1}.pdf`);
  };

  return (
    <Card className="border-none shadow-2xl bg-card rounded-[3.5rem] p-6 sm:p-8 relative overflow-hidden group">
      {/* Decorative backdrop blobs */}
      <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:scale-110 transition-transform duration-700 pointer-events-none">
        <ClipboardList size={220} />
      </div>
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/40">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shrink-0">
            <ClipboardList size={24} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">Boletín de Calificaciones</h2>
            <p className="text-xs text-muted-foreground font-medium mt-0.5">
              Informes oficiales publicados por el instituto académico
            </p>
          </div>
        </div>
        
        {displayedReport && (
          <button
            onClick={handleDownloadPDF}
            className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-950 dark:hover:bg-slate-200 rounded-xl transition-all shadow-md shrink-0 self-start md:self-center"
          >
            <FileDown size={14} /> Exportar PDF
          </button>
        )}
      </div>

      {/* Course Selector Tabs */}
      {courseIds.length > 1 && (
        <div className="flex flex-wrap gap-2 mt-6 p-1.5 bg-muted/40 rounded-2xl border border-border/30 w-fit">
          {courseIds.map((cId) => {
            const firstReport = reportsByCourse[cId][0];
            const courseColor = firstReport?.course?.color || "#3b82f6";
            const isActive = selectedCourseId === cId;
            return (
              <button
                key={cId}
                onClick={() => setSelectedCourseId(cId)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all",
                  isActive
                    ? "bg-background text-foreground shadow-xs scale-[1.02]"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                style={isActive ? { borderLeft: `3px solid ${courseColor}` } : {}}
              >
                <span 
                  className="w-2.5 h-2.5 rounded-full shrink-0" 
                  style={{ backgroundColor: courseColor }}
                />
                {firstReport?.course?.level || firstReport?.course?.name}
              </button>
            );
          })}
        </div>
      )}

      {displayedReport ? (
        <div className="mt-8 space-y-8 relative z-10">
          {/* Period Index Segment Selector */}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-black text-muted-foreground/80">
              Período Evaluativo
            </label>
            <div className="flex flex-wrap gap-2">
              {periodLabels.map((label: string, index: number) => {
                const reportForPeriod = courseReports.find((r) => r.periodIndex === index);
                const isPublished = !!reportForPeriod;
                const isSelected = selectedPeriodIndex === index;

                return (
                  <button
                    key={index}
                    disabled={!isPublished}
                    onClick={() => setSelectedPeriodIndex(index)}
                    className={cn(
                      "flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all relative border",
                      isSelected
                        ? "bg-slate-900 border-slate-900 text-white dark:bg-slate-100 dark:border-slate-100 dark:text-slate-900 shadow-md"
                        : isPublished
                        ? "bg-muted/30 hover:bg-muted/70 text-foreground border-border/40"
                        : "bg-muted/10 text-muted-foreground/50 border-dashed border-border/20 cursor-not-allowed"
                    )}
                  >
                    {isPublished && (
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        isSelected ? "bg-emerald-400" : "bg-emerald-500"
                      )} />
                    )}
                    {label}
                    {!isPublished && (
                      <Lock size={10} className="opacity-40" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Grades Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categories.map((cat: any) => {
              const entry = entries.find((e: any) => e.categoryId === cat.id);
              const value = entry?.value || "";
              
              // Handle Numeric scale visualization
              const isNumeric = cat.scaleType === "NUMERIC";
              const numVal = parseFloat(value);
              const hasNumVal = !isNaN(numVal);
              const minVal = cat.scaleMin ?? 1;
              const maxVal = cat.scaleMax ?? 10;
              const percent = hasNumVal ? Math.min(100, Math.max(0, ((numVal - minVal) / (maxVal - minVal)) * 100)) : 0;
              const courseColor = activeCourseInfo?.color || "#3b82f6";

              // Only use the value to maintain consistency (no descriptions)
              let displayLabel = value || "—";

              return (
                <div 
                  key={cat.id} 
                  className="p-5 rounded-2xl bg-muted/20 border border-border/30 hover:bg-muted/30 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-xs font-bold text-muted-foreground/90 uppercase tracking-wide">
                      {cat.name}
                    </span>
                    <span className={cn(
                      "text-sm font-black px-2.5 py-1 rounded-lg shrink-0",
                      value 
                        ? "bg-primary/5 text-primary border border-primary/10" 
                        : "bg-muted/10 text-muted-foreground/50 border border-transparent"
                    )}>
                      {displayLabel}
                    </span>
                  </div>

                  {isNumeric && value && hasNumVal && (
                    <div className="space-y-1">
                      <div className="h-2 bg-muted/60 dark:bg-muted/40 rounded-full overflow-hidden w-full">
                        <div 
                          className="h-full rounded-full transition-all duration-500 bg-gradient-to-r from-violet-600 to-indigo-500 dark:from-violet-500 dark:to-indigo-400" 
                          style={{ 
                            width: `${percent}%`
                          }}
                        />
                      </div>

                    </div>
                  )}

                  {!value && (
                    <div className="text-[10px] text-muted-foreground/50 italic font-medium">
                      Calificación no provista para este período.
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Teacher Comments */}
          {specialFields.teacherComments && (
            <div className="p-6 bg-primary/5 rounded-3xl border border-primary/10 space-y-3">
              <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                <MessageSquare size={14} />
                Comentarios del Profesor
              </div>
              <p className="text-sm font-medium italic text-muted-foreground leading-relaxed">
                {displayedReport.teacherComments 
                  ? `"${displayedReport.teacherComments}"` 
                  : "El docente no ha registrado observaciones para este período."
                }
              </p>
            </div>
          )}

          {/* Footer Metadata */}
          <div className="pt-6 border-t border-border/30 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs font-medium text-muted-foreground">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-1.5">
                <Calendar size={14} className="text-primary/70" />
                <span>Publicado: {dayjs(displayedReport.publishedAt).format("DD [de] MMMM, YYYY")}</span>
              </div>
              {activeCourseInfo?.teacher?.name && (
                <div className="flex items-center gap-1.5 border-l border-border/30 pl-4">
                  <span className="text-primary/70 font-bold">Docente:</span>
                  <span>Prof. {activeCourseInfo.teacher.name}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 py-1 px-3 bg-muted/40 rounded-full text-[10px] font-black uppercase tracking-wider text-muted-foreground/80 border border-border/30">
              <Award size={12} className="text-emerald-500" />
              <span>Emisión oficial verificada</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-8 text-center text-muted-foreground py-12">
          Selecciona un curso válido.
        </div>
      )}
    </Card>
  );
}
