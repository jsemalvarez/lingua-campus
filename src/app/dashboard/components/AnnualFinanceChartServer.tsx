import prisma from "@/lib/prisma";
import { AnnualFinanceChart } from "./AnnualFinanceChart";
import { instituteMonth, yearDays } from "@/lib/dates";

export async function AnnualFinanceChartServer({ instituteId }: { instituteId: string }) {
    const currentYear = instituteMonth().year;
    // Los movimientos se cortan por día en UTC, como en `/payments` (FIN-34).
    const { first: startOfYear, next: startOfNextYear } = yearDays(currentYear);

    const transactions = await prisma.transaction.findMany({
        where: {
            instituteId,
            date: { gte: startOfYear, lt: startOfNextYear },
            status: "VALID"
        },
        select: { date: true, type: true, amount: true }
    });

    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    
    // Initialize array for 12 months
    const data = monthNames.map(name => ({
        name,
        ingresos: 0,
        gastos: 0,
        rentabilidad: 0
    }));

    transactions.forEach(t => {
        const monthIndex = t.date.getUTCMonth(); // 0-11
        if (t.type === "PAYMENT" || t.type === "MISC_INCOME") {
            data[monthIndex].ingresos += t.amount;
        } else if (t.type === "EXPENSE" || t.type === "PAYROLL") {
            data[monthIndex].gastos += Math.abs(t.amount); // Keep positive for rendering height 
        }
    });

    // Calculate rentabilidad
    data.forEach(d => {
        d.rentabilidad = d.ingresos - d.gastos;
    });

    return <AnnualFinanceChart data={data} year={currentYear} />;
}
