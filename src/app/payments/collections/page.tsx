import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import prisma from "@/lib/prisma";
import { Navbar } from "@/components/layout/Navbar";
import { requireRole } from "@/lib/authz";
import { incomeLabel } from "@/lib/cashCategories";
import { COLLECTION_GROUPS, COLLECTION_TYPES, collectionGroup, collectionMethodLabel, type CollectionGroup } from "@/lib/collections";
import { dayKey, formatDate, formatTime, instituteMonth, instituteTodayKey, monthDays, yearDays } from "@/lib/dates";
import { formatFeeLabel } from "@/lib/utils";
import { CollectionsClient, type CollectionRow } from "./CollectionsClient";

export default async function CollectionsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
    // Sólo ADMIN: son los totales de la caja, que la secretaría tampoco ve en
    // Finanzas. El botón y los totales que traen acá se le esconden, pero el
    // permiso es éste.
    const user = await requireRole(["ADMIN"]);
    if (!user) redirect("/dashboard");

    const params = await searchParams;
    const now = instituteMonth();
    const yearParam = typeof params?.year === "string" ? parseInt(params.year, 10) : NaN;
    const monthParam = typeof params?.month === "string" ? parseInt(params.month, 10) : NaN;
    const year = Number.isInteger(yearParam) ? yearParam : now.year;
    // `0` es «todo el año», igual que en Gastos.
    const month = Number.isInteger(monthParam) && monthParam >= 0 && monthParam <= 12 ? monthParam : now.month;
    const group = COLLECTION_GROUPS.find((g) => g === params?.group) ?? null;

    const { first: from, next: to } = month ? monthDays({ year, month }) : yearDays(year);

    // El libro mayor, los mismos tipos y el mismo corte que «Cobrado en el mes» de
    // Finanzas: los dos totales tienen que dar igual. Por eso los anulados no están
    // —se ven en Movimientos— y tampoco el saldo a favor aplicado, que se asienta
    // en $0: esa plata entró antes. El descuento del 100% es un cobro en $0 y
    // tampoco es plata que entró.
    const movements = await prisma.transaction.findMany({
        where: {
            instituteId: user.instituteId,
            type: { in: [...COLLECTION_TYPES] },
            status: "VALID",
            amount: { gt: 0 },
            date: { gte: from, lt: to }
        },
        include: {
            payment: {
                include: {
                    fee: {
                        include: {
                            student: { select: { id: true, name: true } },
                            enrollment: { select: { course: { select: { name: true } } } }
                        }
                    }
                }
            },
            miscIncome: { include: { student: { select: { id: true, name: true } } } }
        },
        orderBy: [{ date: "asc" }, { createdAt: "asc" }]
    });

    // Sin filtrar por estado, igual que en Gastos: que a quien cobró lo hayan dado
    // de baja después no puede borrarlo del registro.
    const operators = await prisma.user.findMany({
        where: { instituteId: user.instituteId },
        select: { id: true, name: true }
    });
    const operatorMap = Object.fromEntries(operators.map((o) => [o.id, o.name]));

    const rows: CollectionRow[] = movements.map((m) => {
        const rowGroup: CollectionGroup = collectionGroup(m);
        const fee = m.payment?.fee;
        const income = m.miscIncome;
        const student = fee?.student ?? income?.student ?? null;
        const day = dayKey(m.date);
        return {
            id: m.id,
            group: rowGroup,
            method: collectionMethodLabel(m),
            amount: m.amount,
            // El día de la carga inicial no es el día en que se pagó: va sin día.
            day: rowGroup === "sin-registro" ? null : day,
            month: m.date.getUTCMonth() + 1,
            // La hora es la de la carga. Si el ingreso se cargó con fecha de otro
            // día, esa hora no es la del cobro.
            time: rowGroup !== "sin-registro" && instituteTodayKey(m.createdAt) === day ? formatTime(m.createdAt) : null,
            studentId: student?.id ?? null,
            studentName: student?.name ?? null,
            concept: fee
                ? formatFeeLabel(fee.type, fee.month, fee.year)
                : income?.category === "ADELANTO" ? "Adelanto de pago" : income?.description || m.description || "Sin concepto",
            place: fee
                ? fee.enrollment?.course.name ?? null
                : income && income.category !== "ADELANTO" ? incomeLabel(income.category) : null,
            operatorName: m.operatorId ? operatorMap[m.operatorId] ?? "Usuario desconocido" : null
        };
    });

    // Desde cuándo se registra la forma de pago: el primer cobro hecho por pantalla.
    // Sólo hace falta si el período tiene cobros de antes.
    const firstRecorded = rows.some((r) => r.group === "sin-registro")
        ? await prisma.transaction.findFirst({
            where: {
                instituteId: user.instituteId,
                type: { in: [...COLLECTION_TYPES] },
                status: "VALID",
                operatorId: { not: null }
            },
            orderBy: { createdAt: "asc" },
            select: { createdAt: true }
        })
        : null;

    return (
        <div className="min-h-screen bg-background pb-20">
            <Navbar currentActiveRole={user.activeRole} />

            <main className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500">
                <header className="mb-6">
                    <Link
                        href="/payments"
                        className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors mb-4"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a Finanzas
                    </Link>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <ArrowUpRight className="text-emerald-700 dark:text-emerald-400" size={28} />
                        Cobros
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Todo lo que entró a la caja, por período y por forma de pago.
                    </p>
                </header>

                <CollectionsClient
                    // El período nuevo arranca con su filtro y sin la fila abierta del anterior.
                    key={`${year}-${month}-${group ?? ""}`}
                    rows={rows}
                    year={year}
                    month={month}
                    initialGroup={group}
                    recordedSince={firstRecorded ? formatDate(firstRecorded.createdAt, "moment", "numericFull") : null}
                />
            </main>
        </div>
    );
}
