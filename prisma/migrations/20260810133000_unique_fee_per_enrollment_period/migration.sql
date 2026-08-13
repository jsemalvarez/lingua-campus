-- FIN-06 · Una cuota por inscripción, tipo y período.
--
-- Hasta acá la regla se hacía cumplir en memoria ("consultar existentes →
-- filtrar → crear"), que es exactamente el hueco por el que pasan dos clics
-- seguidos o dos usuarios generando a la vez.
--
-- Antes de crear el índice hay que resolver los duplicados que ya existan. Se
-- borran únicamente los que **no tienen ningún pago asociado** — el mismo
-- criterio de `deleteFeeAction`, y lo único que la clave foránea de "Payment"
-- permite borrar. De cada grupo se conserva la cuota con más pagos y, a igualdad,
-- la más antigua: si una de las copias es la que se viene cobrando, esa es la que
-- sobrevive.
--
-- Si en algún grupo quedara más de una cuota con pagos, el CREATE UNIQUE INDEX
-- de abajo falla y el despliegue se detiene. Es deliberado: son cuotas con plata
-- cobrada y decidir cuál sobrevive no es algo que pueda hacer una migración a
-- ciegas. En ese caso hay que mirar los pagos y unificarlos a mano.
DELETE FROM "Fee"
WHERE id IN (
        SELECT id
        FROM (
            SELECT f.id,
                   row_number() OVER (
                       PARTITION BY f."enrollmentId", f.type, f.year, f.month
                       ORDER BY (SELECT count(*) FROM "Payment" p WHERE p."feeId" = f.id) DESC,
                                f."createdAt" ASC,
                                f.id ASC
                   ) AS orden
            FROM "Fee" f
            WHERE f."enrollmentId" IS NOT NULL
        ) ordenadas
        WHERE ordenadas.orden > 1
    )
  AND NOT EXISTS (SELECT 1 FROM "Payment" p WHERE p."feeId" = "Fee".id);

-- CreateIndex
CREATE UNIQUE INDEX "Fee_enrollmentId_type_year_month_key" ON "Fee"("enrollmentId", "type", "year", "month");
