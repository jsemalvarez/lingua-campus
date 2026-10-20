-- La fecha de un movimiento de caja pasa a ser el día contable, sin hora
-- (FIN-34, paso 3 de normalizar las fechas, 18/10/2026). La hora del registro ya
-- está en "createdAt".
--
-- Hasta acá la columna mezclaba dos cosas: gastos, sueldos e ingresos varios
-- guardaban un día a medianoche UTC; cobros, anulaciones, reintegros y adelantos,
-- el instante del registro. La caja leía todo como día UTC, así que un cobro de
-- después de las 21 de Argentina caía en el día siguiente (y el último día del
-- mes, en el mes siguiente).
--
-- La conversión respeta las dos convenciones: la medianoche UTC exacta es un día
-- y se queda con ese día; cualquier otra marca es un instante y toma el día de
-- Argentina. En producción, al 18/10/2026, los 121 gastos y sueldos estaban a
-- medianoche exacta y ninguno de los 1745 instantes caía entre las 21 y la
-- medianoche: ningún movimiento cambia de día.
--
-- Sin DEFAULT: el `now()` de Postgres da el día de UTC. Todas las escrituras
-- pasan la fecha.

-- AlterTable
ALTER TABLE "Transaction" ALTER COLUMN "date" DROP DEFAULT,
ALTER COLUMN "date" SET DATA TYPE DATE USING (
    CASE
        WHEN "date" = date_trunc('day', "date") THEN "date"::date
        ELSE (("date" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Argentina/Buenos_Aires')::date
    END
);
