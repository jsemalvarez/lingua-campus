-- De dónde salió cada marca de asistencia (FEAT-11), y la reparación de BUG-12.
--
-- `ADD COLUMN` con default no reescribe la tabla en Postgres 11+: el default se
-- guarda en el catálogo y las filas existentes se resuelven al leerlas.

-- CreateEnum
CREATE TYPE "AttendanceSource" AS ENUM ('MANUAL', 'QR');

-- AlterTable
ALTER TABLE "Attendance" ADD COLUMN "source" "AttendanceSource" NOT NULL DEFAULT 'MANUAL';

-- Relleno del pasado.
--
-- Hasta hoy la única huella del escáner era un texto que él mismo escribía en
-- `notes`, un campo libre que cualquiera podía editar. Entonces esto recupera
-- **lo que quedó**, no todo lo que pasó: lo anterior a esta migración es
-- aproximado y el panel lo dice.
--
-- El `LIKE` en vez de la igualdad exacta esquiva cualquier problema de
-- codificación con la tilde de "vía".
UPDATE "Attendance"
   SET "source" = 'QR'
 WHERE "notes" LIKE 'Marcado v%a QR Kiosk';

-- Y se libera el campo, que es el fondo de BUG-12: `notes` es la observación de
-- la docente y había pasado a ser una marca técnica. El dato no se pierde
-- --queda en `source`--, se muda a la columna que le corresponde.
UPDATE "Attendance"
   SET "notes" = NULL
 WHERE "notes" LIKE 'Marcado v%a QR Kiosk';
