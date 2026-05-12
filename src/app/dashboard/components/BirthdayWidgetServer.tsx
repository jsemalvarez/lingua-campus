import prisma from "@/lib/prisma";
import { BirthdayWidget } from "./BirthdayWidget";

export interface BirthdayStudent {
    id: string;
    name: string;
    birthDate: Date;
    nextBirthday: Date;
    daysUntil: number;
    isToday: boolean;
    turningAge: number;
    courseNames: string;
}

type RawBirthday = {
    id: string;
    name: string;
    birthDate: Date;
    next_birthday: Date;
    course_names: string;
};

function toStudent(row: RawBirthday, today: Date): BirthdayStudent {
    const next = new Date(row.next_birthday);
    next.setHours(0, 0, 0, 0);
    const diffMs = next.getTime() - today.getTime();
    const daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24));
    
    const birthDate = new Date(row.birthDate);
    // Age they will be turning
    const turningAge = next.getFullYear() - birthDate.getFullYear();

    return {
        id: row.id,
        name: row.name,
        birthDate,
        nextBirthday: next,
        daysUntil,
        isToday: daysUntil === 0,
        turningAge,
        courseNames: row.course_names || "",
    };
}

// ── Admin/Secretary: all institute students ──
async function getBirthdaysForInstitute(instituteId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentMonth = today.getMonth() + 1;

    const weekRaw = await prisma.$queryRaw<RawBirthday[]>`
        WITH base AS (
            SELECT s.id, s.name, s."birthDate",
                MAKE_DATE(
                    EXTRACT(YEAR FROM CURRENT_DATE)::int,
                    EXTRACT(MONTH FROM s."birthDate")::int,
                    EXTRACT(DAY FROM s."birthDate")::int
                ) AS this_year_bday,
                string_agg(c.name, ', ') as course_names
            FROM "Student" s
            LEFT JOIN "Enrollment" e ON e."studentId" = s.id AND e.status = 'ACTIVE'
            LEFT JOIN "Course" c ON c.id = e."courseId"
            WHERE s."instituteId" = ${instituteId}
              AND s.status = 'ACTIVE'
              AND s."birthDate" IS NOT NULL
            GROUP BY s.id, s.name, s."birthDate"
        )
        SELECT id, name, "birthDate", course_names,
            CASE WHEN this_year_bday < CURRENT_DATE
                 THEN this_year_bday + INTERVAL '1 year'
                 ELSE this_year_bday
            END AS next_birthday
        FROM base
        WHERE (
            CASE WHEN this_year_bday < CURRENT_DATE
                 THEN this_year_bday + INTERVAL '1 year'
                 ELSE this_year_bday
            END
        ) BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '6 days'
        ORDER BY next_birthday ASC
    `;

    const monthRaw = await prisma.$queryRaw<RawBirthday[]>`
        WITH base AS (
            SELECT s.id, s.name, s."birthDate",
                MAKE_DATE(
                    EXTRACT(YEAR FROM CURRENT_DATE)::int,
                    EXTRACT(MONTH FROM s."birthDate")::int,
                    EXTRACT(DAY FROM s."birthDate")::int
                ) AS this_year_bday,
                string_agg(c.name, ', ') as course_names
            FROM "Student" s
            LEFT JOIN "Enrollment" e ON e."studentId" = s.id AND e.status = 'ACTIVE'
            LEFT JOIN "Course" c ON c.id = e."courseId"
            WHERE s."instituteId" = ${instituteId}
              AND s.status = 'ACTIVE'
              AND s."birthDate" IS NOT NULL
            GROUP BY s.id, s.name, s."birthDate"
        )
        SELECT id, name, "birthDate", course_names,
            this_year_bday AS next_birthday
        FROM base
        WHERE EXTRACT(MONTH FROM "birthDate") = ${currentMonth}
        ORDER BY EXTRACT(DAY FROM "birthDate") ASC
    `;

    return {
        weekBirthdays: weekRaw.map((r) => toStudent(r, today)),
        monthBirthdays: monthRaw.map((r) => toStudent(r, today)),
        currentMonth,
    };
}

// ── Teacher: only their enrolled students ──
async function getBirthdaysForTeacher(instituteId: string, courseIds: string[]) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentMonth = today.getMonth() + 1;

    const weekRaw = await prisma.$queryRaw<RawBirthday[]>`
        WITH base AS (
            SELECT s.id, s.name, s."birthDate",
                MAKE_DATE(
                    EXTRACT(YEAR FROM CURRENT_DATE)::int,
                    EXTRACT(MONTH FROM s."birthDate")::int,
                    EXTRACT(DAY FROM s."birthDate")::int
                ) AS this_year_bday,
                string_agg(DISTINCT c.name, ', ') as course_names
            FROM "Student" s
            INNER JOIN "Enrollment" e ON e."studentId" = s.id
                AND e."courseId" = ANY(${courseIds}::text[])
                AND e.status = 'ACTIVE'
            INNER JOIN "Course" c ON c.id = e."courseId"
            WHERE s."instituteId" = ${instituteId}
              AND s.status = 'ACTIVE'
              AND s."birthDate" IS NOT NULL
            GROUP BY s.id, s.name, s."birthDate"
        )
        SELECT id, name, "birthDate", course_names,
            CASE WHEN this_year_bday < CURRENT_DATE
                 THEN this_year_bday + INTERVAL '1 year'
                 ELSE this_year_bday
            END AS next_birthday
        FROM base
        WHERE (
            CASE WHEN this_year_bday < CURRENT_DATE
                 THEN this_year_bday + INTERVAL '1 year'
                 ELSE this_year_bday
            END
        ) BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '6 days'
        ORDER BY next_birthday ASC
    `;

    const monthRaw = await prisma.$queryRaw<RawBirthday[]>`
        WITH base AS (
            SELECT s.id, s.name, s."birthDate",
                MAKE_DATE(
                    EXTRACT(YEAR FROM CURRENT_DATE)::int,
                    EXTRACT(MONTH FROM s."birthDate")::int,
                    EXTRACT(DAY FROM s."birthDate")::int
                ) AS this_year_bday,
                string_agg(DISTINCT c.name, ', ') as course_names
            FROM "Student" s
            INNER JOIN "Enrollment" e ON e."studentId" = s.id
                AND e."courseId" = ANY(${courseIds}::text[])
                AND e.status = 'ACTIVE'
            INNER JOIN "Course" c ON c.id = e."courseId"
            WHERE s."instituteId" = ${instituteId}
              AND s.status = 'ACTIVE'
              AND s."birthDate" IS NOT NULL
            GROUP BY s.id, s.name, s."birthDate"
        )
        SELECT id, name, "birthDate", course_names,
            this_year_bday AS next_birthday
        FROM base
        WHERE EXTRACT(MONTH FROM "birthDate") = ${currentMonth}
        ORDER BY EXTRACT(DAY FROM "birthDate") ASC
    `;

    return {
        weekBirthdays: weekRaw.map((r) => toStudent(r, today)),
        monthBirthdays: monthRaw.map((r) => toStudent(r, today)),
        currentMonth,
    };
}

// ── Exported Server Components ──

export async function BirthdayWidgetServer({ instituteId }: { instituteId: string }) {
    const data = await getBirthdaysForInstitute(instituteId);
    return <BirthdayWidget {...data} />;
}

export async function BirthdayWidgetTeacherServer({
    instituteId,
    courseIds,
}: {
    instituteId: string;
    courseIds: string[];
}) {
    if (courseIds.length === 0) return null;
    const data = await getBirthdaysForTeacher(instituteId, courseIds);
    return <BirthdayWidget {...data} />;
}
