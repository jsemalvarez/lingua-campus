-- FIN-12 · Una matrícula por inscripción y año.
--
-- La matrícula es por curso: la unidad es la inscripción, no el alumno. La
-- restricción única de FIN-06 —("enrollmentId", type, year, month)— ya diría eso,
-- salvo por el mes: hasta acá cada matrícula se guardaba con el mes en que se la
-- creó, así que dos generaciones en meses distintos convivían sin chocar. Con el
-- mes fijo en 0 para todas, la restricción que ya existe significa lo que tiene
-- que significar, y no hace falta un índice parcial (que Prisma no sabe expresar
-- y habría quedado fuera de su radar).
--
-- El 0 no es un mes: la matrícula es anual y no tiene vencimiento mensual.
-- Ninguna pantalla lo muestra — `formatFeeLabel` ignora el mes de las matrículas.
--
-- Antes de normalizar hay que resolver las matrículas que hoy conviven en meses
-- distintos para la misma inscripción y año, porque al igualar el mes chocarían.
-- Mismo criterio que la migración de FIN-06: se borran únicamente las que **no
-- tienen ningún pago asociado** —lo único que la clave foránea de "Payment"
-- permite borrar, y el mismo criterio de `deleteFeeAction`— conservando de cada
-- grupo la que tiene más pagos y, a igualdad, la más antigua.
--
-- Si en algún grupo quedara más de una con pagos, el UPDATE de abajo viola el
-- índice único y el despliegue se detiene. Es deliberado: son matrículas con
-- plata cobrada y decidir cuál sobrevive no es algo que pueda hacer una
-- migración a ciegas. En ese caso hay que mirar los pagos y unificarlos a mano.
DELETE FROM "Fee"
WHERE id IN (
        SELECT id
        FROM (
            SELECT f.id,
                   row_number() OVER (
                       PARTITION BY f."enrollmentId", f.year
                       ORDER BY (SELECT count(*) FROM "Payment" p WHERE p."feeId" = f.id) DESC,
                                f."createdAt" ASC,
                                f.id ASC
                   ) AS orden
            FROM "Fee" f
            WHERE f.type = 'ENROLLMENT'
              AND f."enrollmentId" IS NOT NULL
        ) ordenadas
        WHERE ordenadas.orden > 1
    )
  AND NOT EXISTS (SELECT 1 FROM "Payment" p WHERE p."feeId" = "Fee".id);

-- Normalizar el mes. Alcanza a las anticipadas también ("enrollmentId" NULL):
-- no las protege ningún índice, pero deja a todas las matrículas con la misma
-- forma, que es lo que espera el código de acá en adelante.
UPDATE "Fee"
SET "month" = 0
WHERE type = 'ENROLLMENT'
  AND "month" <> 0;
