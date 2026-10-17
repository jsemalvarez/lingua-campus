-- La fecha del examen final por curso y la marca de su clase. Columnas nuevas,
-- sin tocar datos existentes.

-- AlterTable
ALTER TABLE "Course" ADD COLUMN "examDate" DATE;

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN "finalExam" BOOLEAN NOT NULL DEFAULT false;

-- Las clases del examen final que creó el registro de exámenes antes de esta
-- marca se reconocen por el texto fijo que les ponía. Sin esto, cargar la fecha
-- crearía una segunda. En producción no hay ninguna al 16/10/2026.
UPDATE "Lesson"
SET "finalExam" = true
WHERE "type" = 'EXAM'
  AND "content" = 'Generado automáticamente por el registro de exámenes finales.';
