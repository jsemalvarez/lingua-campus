import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { AlertCircle } from "lucide-react";
import { getDebtorsReportAction } from "../billingActions";
import { DebtorsClient } from "./DebtorsClient";
import { formatFeeLabel, getMonthName } from "@/lib/utils";
import { getActiveRole } from "@/lib/roles";

export default async function DebtorsPage() {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) redirect("/login");

    const sessionUser = session.user;
    const userRoles = sessionUser.roles ?? [];
    const activeRole = await getActiveRole(userRoles);

    const allowedRoles = ["ADMIN", "SECRETARY", "SUPERADMIN"];
    if (!allowedRoles.includes(activeRole)) {
        redirect("/dashboard");
    }

    const result = await getDebtorsReportAction();
    if (!result.success || !result.data) {
        return <div className="p-10 text-center">Error al cargar deudores.</div>;
    }

    const debtors = result.data;

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();


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
            label: `${formatFeeLabel(fee.type, fee.month, fee.year)}${fee.enrollment?.course.name ? ` (${fee.enrollment.course.name})` : ""}`,
            isCurrent,
            amount: owed,
            isPaid: fee.paidAmount > 0,
            // El período crudo, además de la etiqueta ya armada: es con lo que
            // filtra por mes la pantalla. Ojo con las matrículas y los derechos
            // de examen, que van con `month = 0` a propósito (FIN-12, FIN-17) y
            // por eso no caen en ningún mes del selector.
            month: fee.month,
            year: fee.year,
        });
        return acc;
    }, {});

    const summaryList = Object.values(summary).sort((a: any, b: any) => b.totalOwed - a.totalOwed) as any[];

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar currentActiveRole={activeRole} />
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
                    currentMonthLabel={`${getMonthName(currentMonth)} ${currentYear}`}
                    currentMonth={currentMonth}
                    currentYear={currentYear}
                />
            </main>
        </div>
    );
}
