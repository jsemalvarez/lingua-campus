-- Cuatro fechas que son días sin hora pasan a guardarse como `date`, igual que
-- `Lesson.date` y `Course.examDate` (paso 2 de normalizar las fechas, 18/10/2026).
--
-- Eran `timestamp` y no tenían una sola convención. En producción, al
-- 18/10/2026, los 399 nacimientos estaban a las 00:00 UTC (257, la medianoche de
-- Londres), a las 03:00 (136, la de Argentina) o a las 02:00 (6, la de
-- Argentina con el horario de verano de 2007-2009); los cursos y el inicio de
-- actividad, todos a las 00:00. Mostrados en hora argentina, los de las 00:00
-- caían el día anterior.
--
-- `::date` toma el día UTC de la marca guardada, que en los tres casos es el día
-- que se cargó: 00:00, 02:00 y 03:00 UTC son todas del mismo día. No se pierde
-- nada: ninguna de estas columnas tiene hora con sentido.

-- AlterTable
ALTER TABLE "Student" ALTER COLUMN "birthDate" SET DATA TYPE DATE USING "birthDate"::date;

-- AlterTable
ALTER TABLE "Course" ALTER COLUMN "startDate" SET DATA TYPE DATE USING "startDate"::date,
ALTER COLUMN "endDate" SET DATA TYPE DATE USING "endDate"::date;

-- AlterTable
ALTER TABLE "Institute" ALTER COLUMN "activityStartDate" SET DATA TYPE DATE USING "activityStartDate"::date;
