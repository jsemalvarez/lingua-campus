import prisma from "@/lib/prisma";
import { AnnualFinanceChart } from "./AnnualFinanceChart";

export async function AnnualFinanceChartServer({ instituteId }: { instituteId: string }) {
    const currentYear = new Date().getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);
    const endOfYear = new Date(currentYear, 12, 0, 23, 59, 59);

    const transactions = await prisma.transaction.findMany({
        where: {
            instituteId,
            date: { gte: startOfYear, lte: endOfYear },
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
        const monthIndex = t.date.getMonth(); // 0-11
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
