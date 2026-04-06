import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { AlertCircle } from "lucide-react";
import { getDebtorsReportAction } from "../billingActions";
import { DebtorsClient } from "./DebtorsClient";

export default async function DebtorsPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) redirect("/login");

    const result = await getDebtorsReportAction();
    if (!result.success || !result.data) {
        return <div className="p-10 text-center">Error al cargar deudores.</div>;
    }

    const debtors = result.data;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const monthNames = [
        "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
        "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    // Agrupar por estudiante para totales
    const summary = debtors.reduce((acc: any, fee) => {
        const sid = fee.studentId;
        const isCurrent = fee.month === currentMonth && fee.year === currentYear;
        const owed = fee.originalAmount - fee.paidAmount;

        if (!acc[sid]) {
            acc[sid] = {
                name: fee.student.name,
                phone: fee.student.phone,
                totalOwed: 0,
                currentMonthOwed: 0,
                previousMonthsOwed: 0,
                months: [],
            };
        }

        acc[sid].totalOwed += owed;
        if (isCurrent) {
            acc[sid].currentMonthOwed += owed;
        } else {
            acc[sid].previousMonthsOwed += owed;
        }

        acc[sid].months.push({
            feeId: fee.id,
            label:
                fee.type === "ENROLLMENT"
                    ? `Matrícula ${fee.year}`
                    : fee.type === "EXAM"
                        ? `Derecho de Examen ${fee.year}`
                        : `${fee.month}/${fee.year} (${fee.enrollment?.course.name || "Sin curso"})`,
            isCurrent,
            amount: owed,
            isPaid: fee.paidAmount > 0,
        });
        return acc;
    }, {});

    const summaryList = Object.values(summary).sort((a: any, b: any) => b.totalOwed - a.totalOwed) as any[];

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar />
            <main className="container mx-auto px-4 py-8 max-w-5xl">
                <header className="mb-8">
                    <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
                        <AlertCircle className="text-rose-600" size={32} />
                        Reporte de Deudores
                    </h1>
                    <p className="text-muted-foreground mt-1 text-sm sm:text-base">
                        Listado detallado de saldos pendientes y cuotas vencidas.
                    </p>
                </header>

                <DebtorsClient
                    summaryList={summaryList}
                    currentMonthLabel={`${monthNames[currentMonth - 1]} ${currentYear}`}
                    monthNames={monthNames}
                    currentMonth={currentMonth}
                />
            </main>
        </div>
    );
}
