-- FIN-17 · Un derecho de examen por inscripción y año.
--
-- Es la migración de FIN-12 aplicada al último tipo de cuota que había quedado
-- afuera. FIN-12 le fijó el mes a las matrículas; las de examen siguieron
-- naciendo con el mes en que alguien tocó el interruptor de
-- `toggleExamRegistrationAction`, que es el mismo valor administrativo sin
-- significado.
--
-- Con ese mes, la restricción única de FIN-06 —("enrollmentId", type, year,
-- month)— **no las alcanza**: dos cuotas de examen de la misma inscripción y año
-- en meses distintos no chocan. La regla la hacía cumplir sola la consulta previa
-- de la función, que busca por inscripción y año ignorando el mes: es el
-- "consultar y después crear" de FIN-06, sin red debajo. Con el mes fijo en 0, la
-- base dice lo mismo que esa consulta.
--
-- El 0 lo comparte con las matrículas y no hay ambigüedad: `type` está dentro de
-- la restricción, así que la matrícula y el examen de la misma inscripción y año
-- siguen siendo dos filas distintas.
--
-- **Medido antes de escribir esto, el 17/08: no hay una sola cuota de examen.**
-- Cero en producción y cero en stage, de cualquier año y con cualquier mes. El
-- interruptor de examen todavía no se usó, así que las dos sentencias de abajo no
-- van a tocar ninguna fila en ninguna de las dos bases: esto es preventivo, y
-- entra ahora porque después de la primera cuota emitida deja de ser gratis.
--
-- El DELETE mantiene el criterio de FIN-06 y FIN-12, por si alguna base —la de
-- desarrollo, o la de un instituto futuro— sí tiene filas: se borran únicamente
-- las duplicadas que **no tienen ningún pago asociado**, conservando de cada
-- grupo la que tiene más pagos y, a igualdad, la más antigua.
--
-- Si en algún grupo quedara más de una con pagos, el UPDATE viola el índice único
-- y el despliegue se detiene. Es deliberado, igual que en FIN-12: es plata
-- cobrada, y decidir cuál sobrevive no es algo que pueda hacer una migración a
-- ciegas.
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
            WHERE f.type = 'EXAM'
              AND f."enrollmentId" IS NOT NULL
        ) ordenadas
        WHERE ordenadas.orden > 1
    )
  AND NOT EXISTS (SELECT 1 FROM "Payment" p WHERE p."feeId" = "Fee".id);

-- Normalizar el mes. Alcanza también a las de examen sin inscripción, si las
-- hubiera: no las protege ningún índice —en Postgres los NULL no chocan entre
-- sí—, pero deja a todas con la misma forma, que es lo que espera el código de
-- acá en adelante. Es el mismo cierre que hizo FIN-12 con las anticipadas.
UPDATE "Fee"
SET "month" = 0
WHERE type = 'EXAM'
  AND "month" <> 0;
