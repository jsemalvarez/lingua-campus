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
import { ReportSignatureBox } from "./ReportSignatureBox";
import { strokeToPath, type StrokeData } from "@/lib/reports/signatureCompare";
import { isLegacyBatch, type BatchSignerRole } from "@/lib/reports/batchSignatures";

/** Una firma del instituto que sigue valiendo para este boletín (FEAT-21). */
type SignatureLine = {
  role: BatchSignerRole;
  signerName: string;
  signedAt: string;
  strokeData: StrokeData | null;
};

/**
 * Dibuja el trazo en el PDF, punto por punto dentro del recuadro.
 *
 * Las coordenadas vienen normalizadas de 0 a 1, así que la misma firma se
 * redibuja en cualquier tamaño. No se pasa por imagen: son unos cientos de
 * segmentos y el PDF queda vectorial.
 */
function drawStrokeOnPdf(
  doc: jsPDF,
  stroke: StrokeData,
  x: number,
  y: number,
  w: number,
  h: number
) {
  doc.setDrawColor(30, 41, 59);
  doc.setLineWidth(0.4);
  for (const s of stroke.strokes) {
    for (let i = 1; i < s.length; i++) {
      const a = s[i - 1];
      const b = s[i];
      doc.line(x + a.x * w, y + a.y * h, x + b.x * w, y + b.y * h);
    }
  }
}

interface StudentReportViewerProps {
  studentName: string;
  reports: any[];
  instituteName?: string;
  /** Quién está mirando, para saber si le toca firmar (FEAT-09). */
  viewer?: { id: string; isStudent: boolean };
  /** Su firma de referencia, para mostrársela mientras firma. */
  signatureReference?: any;
}

export function StudentReportViewer({
  studentName,
  reports,
  instituteName,
  viewer,
  signatureReference
}: StudentReportViewerProps) {
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

  // Sin ningún informe publicado, la sección no se dibuja (FEAT-27).
  //
  // Lo que había acá era un cartel —«Informe Trimestral», candado, «Próximamente
  // disponible»— que prometía un boletín que para este alumno puede no existir
  // nunca, y que no tenía forma de dejar de prometerlo: en abril decía lo mismo
  // que en diciembre. No confundir con el alumno que **sí** tiene informes y
  // mira un período todavía sin publicar: ése es un período real de la plantilla
  // de su curso y sigue mostrándose con candado más abajo.
  if (reports.length === 0) return null;

  const activeCourseInfo = displayedReport?.course;
  const categories = displayedReport?.template?.categories || [];
  const entries = displayedReport?.entries || [];
  const specialFields = displayedReport?.template?.specialFields as any || {};

  // Las firmas del instituto que **siguen valiendo para este alumno**: el
  // servidor ya descartó las que se cayeron porque le tocaron la nota (FEAT-21).
  const signatureLines: SignatureLine[] = displayedReport?.signatureLines ?? [];

  // Un firmante es un User (tutor) o un Student (el alumno de 20+ que firma solo).
  const isViewer = (row: { userId: string | null; studentId: string | null }) =>
    !viewer ? false : viewer.isStudent ? row.studentId === viewer.id : row.userId === viewer.id;

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

    // Firmas del instituto (FEAT-21).
    //
    // Una tanda anterior a la funcionalidad no pudo firmarse, así que sigue
    // imprimiendo la raya y el nombre como venía: aplicarle la regla nueva le
    // sacaría al boletín de marzo las dos líneas que hoy tiene. En las tandas
    // nuevas, sin firma no hay línea — una raya vacía en un boletín digital se
    // lee como algo que falta.
    const legacy = isLegacyBatch(displayedReport.publishedAt);
    const firmaDocente = signatureLines.find(l => l.role === "TEACHER");
    const firmaDireccion = signatureLines.find(l => l.role === "ADMIN");

    const bloques: { x: number; centro: number; firma?: SignatureLine; pie: string }[] = [];

    if (firmaDocente || legacy) {
      bloques.push({
        x: 14,
        centro: 47,
        firma: firmaDocente,
        pie: firmaDocente
          ? `Prof. ${firmaDocente.signerName}`
          : `Prof. ${activeCourseInfo?.teacher?.name || "Docente"}`
      });
    }

    if (firmaDireccion || legacy) {
      bloques.push({
        x: 130,
        centro: 163,
        firma: firmaDireccion,
        pie: firmaDireccion ? firmaDireccion.signerName : "Firma de la Institución"
      });
    }

    if (bloques.length > 0) {
      if (currentY > 255) {
        doc.addPage();
        currentY = 40;
      }

      for (const bloque of bloques) {
        if (bloque.firma?.strokeData) {
          drawStrokeOnPdf(doc, bloque.firma.strokeData, bloque.x, currentY - 15, 66, 14);
        }

        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.5);
        doc.line(bloque.x, currentY, bloque.x + 66, currentY);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text(bloque.pie, bloque.centro, currentY + 5, { align: "center" });

        if (bloque.firma) {
          doc.setFont("helvetica", "normal");
          doc.setFontSize(7);
          doc.setTextColor(100, 116, 139);
          doc.text(
            `${bloque.firma.role === "ADMIN" ? "Dirección" : "Docente"} · ${dayjs(bloque.firma.signedAt).format("D/M/YYYY")}`,
            bloque.centro,
            currentY + 9,
            { align: "center" }
          );
          doc.setTextColor(51, 65, 85);
        }
      }
    }

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

          {/* Firmas del instituto (FEAT-21) */}
          {signatureLines.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {signatureLines.map((line) => (
                <div
                  key={line.role}
                  className="p-5 rounded-2xl bg-muted/20 border border-border/30 flex flex-col items-center gap-2"
                >
                  {line.strokeData ? (
                    <svg
                      viewBox="0 0 200 60"
                      className="w-full max-w-[200px] h-[60px] text-foreground"
                      role="img"
                      aria-label={`Firma de ${line.signerName}`}
                    >
                      <path
                        d={strokeToPath(line.strokeData, 200, 60)}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={1.6}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <div className="h-[60px]" />
                  )}
                  <div className="w-full pt-2 border-t border-border/50 text-center">
                    <p className="text-sm font-bold">
                      {line.role === "TEACHER" ? `Prof. ${line.signerName}` : line.signerName}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mt-0.5">
                      {line.role === "TEACHER" ? "Docente" : "Dirección"} ·{" "}
                      {dayjs(line.signedAt).format("D/M/YYYY")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Firma de conformidad (FEAT-09) */}
          {viewer && (
            <ReportSignatureBox
              reportId={displayedReport.id}
              mustSign={(displayedReport.signers ?? []).some(isViewer)}
              mySignedAt={
                (displayedReport.signatures ?? []).find(isViewer)?.signedAt ?? null
              }
              alreadySignedByOther={(displayedReport.signatures ?? []).length > 0}
              reference={signatureReference ?? null}
            />
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
