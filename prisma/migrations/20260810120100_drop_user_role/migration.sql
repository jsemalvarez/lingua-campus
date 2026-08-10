-- SEC-01 · Borrar la columna `role`, ya reconciliada en `roles[]`.
--
-- Va en una migración aparte del backfill a propósito: si algo sale mal, la
-- anterior se puede dejar aplicada sin perder datos.

ALTER TABLE "User" DROP COLUMN "role";
