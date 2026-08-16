-- FIN-23 · Una inscripción con cuotas emitidas no se puede borrar.
--
-- La clave foránea era `ON DELETE SET NULL`, que es lo que Prisma pone por
-- defecto en una relación opcional. Con eso, borrar una fila de "Enrollment"
-- le ponía `enrollmentId = NULL` a todas sus cuotas —las pagas incluidas—, en
-- silencio y sin que quedara rastro de a qué curso pertenecían. La cuota
-- sobrevivía, porque "Fee_studentId_fkey" es RESTRICT, pero quedaba sin dueño:
-- fuera del listado del curso, sin curso que nombrar en el recibo, y salteada
-- por el generador mensual desde FIN-22.
--
-- Es lo que le pasó a los dos alumnos que reportó el instituto: los sacaron del
-- curso viejo, se les soltó el historial entero, los inscribieron en el nuevo y
-- la corrida siguiente volvió a emitir la cuota del mes.
--
-- Con RESTRICT, Postgres rechaza el borrado mientras alguna cuota apunte a esa
-- inscripción. No es un cambio de comportamiento escondido en el código: es la
-- regla puesta donde no se puede eludir, ni siquiera desde un camino que
-- escribamos más adelante. `removeStudentFromCourseAction` la verifica antes
-- para poder dar un mensaje útil, y esto es la red de abajo.
--
-- **No borra ni modifica ninguna fila.** RESTRICT sólo actúa sobre borrados
-- futuros; las cuotas que hoy ya están sueltas no lo violan y quedan como
-- están. Su normalización es otro asunto, y se hace mirándolas.
--
-- Ojo con `purgeStudentAction`: borraba las inscripciones antes que las cuotas y
-- le funcionaba justamente porque el SET NULL las desvinculaba en el camino. Se
-- invirtió ese orden en el mismo commit. Ver ARQ-14.
ALTER TABLE "Fee" DROP CONSTRAINT "Fee_enrollmentId_fkey";

ALTER TABLE "Fee" ADD CONSTRAINT "Fee_enrollmentId_fkey"
    FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;
