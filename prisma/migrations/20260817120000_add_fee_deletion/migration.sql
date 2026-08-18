-- FEAT-10 · La cuota borrada deja su foto, con motivo.
--
-- `deleteFeeAction` borra la fila de "Fee" físicamente. Es la única acción de
-- plata que lo hace —y sólo sobre deuda impaga: se niega si la cuota tiene
-- pagos—, pero borra una deuda, y hasta hoy eso desaparecía de la aplicación sin
-- dejar nada que mirar.
--
-- SEC-03 le puso un rastro: un asiento de importe 0 en "Transaction". Sirvió
-- como puente, pero no alcanza para una pantalla. La tabla del libro mayor
-- filtra los movimientos en cero —filtro que FIN-11 decidió mantener, porque esa
-- pantalla es la caja—, así que el rastro sólo se consulta desde la base;
-- listarlo obligaría a filtrar por el *texto* de la descripción; y no tiene
-- dónde guardar el motivo, que es lo único que contesta por qué se borró.
--
-- Esta tabla es la foto de la cuota que ya no existe. Nada de esto es una
-- referencia: no hay claves foráneas a "Student", a "Course" ni a "User", a
-- propósito. El registro tiene que sobrevivir a que después se borre o se purgue
-- lo que nombra, que es exactamente el caso para el que se escribe. Por eso el
-- alumno va con su id *y* con su nombre.
--
-- El índice es como lo lista la pantalla: por instituto, lo último arriba.
--
-- **No borra ni modifica ninguna fila.** Sólo crea la tabla. Los asientos de
-- importe 0 que "deleteFeeAction" haya escrito antes de esto quedan donde están,
-- en "Transaction", y no aparecen en la pantalla nueva: es la ventana de
-- huérfanos que la ficha de FEAT-10 anticipa. Medida contra producción el
-- 16/08 (consulta 5 del lote), esa ventana es de cero filas.

-- CreateTable
CREATE TABLE "FeeDeletion" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "type" "FeeType" NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "courseName" TEXT,
    "reason" TEXT NOT NULL,
    "deletedById" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FeeDeletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FeeDeletion_instituteId_deletedAt_idx" ON "FeeDeletion"("instituteId", "deletedAt");
