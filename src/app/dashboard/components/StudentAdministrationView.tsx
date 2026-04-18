"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { 
  Wallet, 
  DollarSign, 
  Calendar, 
  Receipt, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  ArrowRightCircle,
  TrendingDown
} from "lucide-react";
import dayjs from "dayjs";
import { cn, getMonthName } from "@/lib/utils";
import { ReceiptDownloadButton } from "@/components/financials/ReceiptDownloadButton";

interface StudentAdministrationViewProps {
  student: any;
  fees: any[];
}

export function StudentAdministrationView({
  student,
  fees
}: StudentAdministrationViewProps) {
  
  const formatter = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' });
  const now = dayjs();
  const currentMonth = now.month();
  const currentYear = now.year();

  const pendingFees = fees.filter(f => f.status !== "PAID" && f.status !== "VOIDED");
  const paidFees = fees.filter(f => f.status === "PAID" && f.paidAmount > 0);

  const oldDebtSum = pendingFees
    .filter(f => f.year < currentYear || (f.year === currentYear && f.month < currentMonth))
    .reduce((acc, f) => acc + (f.originalAmount - f.paidAmount), 0);

  const currentMonthDebtSum = pendingFees
    .filter(f => f.year === currentYear && f.month === currentMonth)
    .reduce((acc, f) => acc + (f.originalAmount - f.paidAmount), 0);

  return (
    <main className="container mx-auto px-4 sm:px-6 py-10 space-y-10 animate-in mt-12 mb-24 max-w-6xl">
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-2 border-b border-border/50">
        <div className="space-y-1">
          <span className="text-sm font-black text-primary/80 uppercase tracking-widest flex items-center gap-2 mb-2">
            <Wallet size={16} /> Administración Personal
          </span>
          <h1 className="text-4xl font-black tracking-tight italic uppercase">Tu Estado de Cuenta</h1>
          <p className="text-muted-foreground font-medium">Gestiona tus cuotas, pagos y comprobantes de forma independiente.</p>
        </div>
      </header>

      {/* METRICS ROW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-8 border-y-0 border-r-0 border-l-4 border-l-rose-500 shadow-xl bg-gradient-to-br from-rose-500/10 to-transparent relative overflow-hidden rounded-[2.5rem]">
           <div className="absolute top-0 right-0 p-8 opacity-10">
              <AlertCircle size={80} className="text-rose-600" />
           </div>
           <p className="text-xs font-black uppercase tracking-widest text-rose-600 mb-2">Deuda Pendiente</p>
           <h2 className="text-4xl font-black tracking-tight">{formatter.format(oldDebtSum)}</h2>
           <p className="mt-4 text-[10px] font-bold text-rose-600/70 uppercase">Ciclos anteriores</p>
        </Card>

        <Card className="p-8 border-y-0 border-r-0 border-l-4 border-l-amber-500 shadow-xl bg-gradient-to-br from-amber-500/10 to-transparent relative overflow-hidden rounded-[2.5rem]">
           <div className="absolute top-0 right-0 p-8 opacity-10">
              <Calendar size={80} className="text-amber-600" />
           </div>
           <p className="text-xs font-black uppercase tracking-widest text-amber-600 mb-2">Mes Actual</p>
           <h2 className="text-4xl font-black tracking-tight">{formatter.format(currentMonthDebtSum)}</h2>
           <p className="mt-4 text-[10px] font-bold text-amber-600/70 uppercase">Vencimiento en curso</p>
        </Card>

        <Card className="p-8 border-y-0 border-r-0 border-l-4 border-l-emerald-500 shadow-xl bg-gradient-to-br from-emerald-500/10 to-transparent relative overflow-hidden rounded-[2.5rem]">
           <p className="text-xs font-black uppercase tracking-widest text-emerald-600 mb-2">Saldo a Favor</p>
           <h2 className="text-4xl font-black tracking-tight">{formatter.format(student.creditBalance || 0)}</h2>
           <p className="mt-4 text-[10px] font-bold text-emerald-600/70 uppercase">Crédito disponible</p>
        </Card>
      </div>

      {/* MAIN CONTENT GRID */}
      <div className="grid lg:grid-cols-5 gap-8 items-start">
         
         {/* Detail Table */}
         <div className="lg:col-span-3 space-y-6">
            <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
               <DollarSign size={22} className="text-primary" /> Detalle de Cuotas
            </h3>
            
            <div className="space-y-4">
               {pendingFees.length === 0 ? (
                 <div className="py-20 text-center bg-muted/20 border border-dashed border-border/50 rounded-[2.5rem] flex flex-col items-center gap-4">
                    <CheckCircle2 size={48} className="text-emerald-500 opacity-20" />
                    <p className="text-muted-foreground font-medium italic">¡Estás al día! No tienes deudas pendientes.</p>
                 </div>
               ) : (
                 pendingFees.map(fee => (
                   <Card key={fee.id} className="p-6 border-none shadow-md bg-card rounded-[2.5rem] hover:scale-[1.01] transition-all group overflow-hidden">
                      <div className="flex items-center justify-between">
                         <div className="flex items-center gap-5">
                            <div className="w-14 h-14 bg-muted/50 rounded-2xl flex items-center justify-center">
                               <Calendar className={cn(
                                 (fee.year < currentYear || (fee.year === currentYear && fee.month < currentMonth)) 
                                   ? "text-rose-500" : "text-primary"
                               )} size={24} />
                            </div>
                            <div>
                               <h4 className="text-lg font-black tracking-tight italic uppercase">Cuota {getMonthName(fee.month)} {fee.year}</h4>
                               <p className="text-[10px] font-bold uppercase text-muted-foreground mt-1 tracking-widest">
                                 {fee.year < currentYear || (fee.year === currentYear && fee.month < currentMonth) ? "Vencida" : "En Fecha"}
                               </p>
                            </div>
                         </div>
                         <div className="text-right flex items-center gap-6">
                            <div>
                               <p className="text-2xl font-black">{formatter.format(fee.originalAmount - fee.paidAmount)}</p>
                            </div>
                            <button className="bg-primary text-white p-3 rounded-2xl shadow-lg shadow-primary/20 hover:rotate-6 transition-all active:scale-95">
                               <ArrowRightCircle size={24} />
                            </button>
                         </div>
                      </div>
                   </Card>
                 ))
               )}
            </div>
         </div>

         {/* Sidebar: Recent Payments */}
         <div className="lg:col-span-2 space-y-8">
            <Card className="p-8 rounded-[3rem] border-none shadow-xl bg-card">
               <h3 className="text-xl font-black tracking-tight flex items-center gap-2 mb-8">
                  <Receipt size={22} className="text-emerald-500" /> Pagos Recientes
               </h3>
               
               <div className="space-y-6">
                  {paidFees.length === 0 ? (
                    <p className="text-center py-8 italic text-muted-foreground opacity-30">No hay pagos registrados</p>
                  ) : (
                    paidFees.slice(0, 5).map(fee => (
                      <div key={fee.id} className="flex items-center justify-between group">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg overflow-hidden shrink-0">
                               <DollarSign size={18} />
                            </div>
                            <div>
                               <p className="text-sm font-black italic uppercase">Cuota {getMonthName(fee.month)}</p>
                               <p className="text-[10px] font-bold text-muted-foreground">{dayjs(fee.datePaid).format('DD/MM/YYYY')}</p>
                            </div>
                         </div>
                         <div className="text-right">
                           <p className="text-sm font-black text-emerald-600">{formatter.format(fee.paidAmount)}</p>
                           {fee.payments && fee.payments[0] && (
                             <ReceiptDownloadButton 
                                paymentId={fee.payments[0].id} 
                                variant="ghost" 
                                className="h-6 px-2 text-[8px] font-black uppercase text-primary hover:bg-primary/5 rounded-lg mt-1" 
                             />
                           )}
                         </div>
                      </div>
                    ))
                  )}
               </div>
               
               <div className="mt-10 pt-8 border-t border-border/50">
                  <div className="flex gap-4">
                     <div className="p-2 h-fit bg-sky-500/10 rounded-xl text-sky-600">
                        <Info size={16} />
                     </div>
                     <p className="text-xs font-medium text-muted-foreground leading-relaxed">
                       Recuerda que puedes realizar tus pagos vía transferencia bancaria o en nuestra recepción física.
                     </p>
                  </div>
               </div>
            </Card>
         </div>
      </div>

    </main>
  );
}
