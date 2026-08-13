-- BUG-02 y BUG-03 · Borrado lógico de la clase.
--
-- `PracticeSession` apunta a `Lesson` y a `LessonPractice` sin `onDelete: Cascade`,
-- así que queda en `Restrict`: borrar una clase que algún alumno ya practicó viola
-- la clave foránea y el docente recibe un error genérico que no explica nada.
--
-- No se resuelve agregando el cascade. El criterio del cliente es **borrado lógico
-- siempre**: si alguien del instituto borra lo que no debe, los datos tienen que
-- seguir estando. Un cascade haría exactamente lo contrario — se llevaría puestas
-- las sesiones de práctica de los alumnos, que son su historial de aprendizaje y
-- nada tienen que ver con que el docente haya querido sacar la clase de la lista.
--
-- Entonces `Lesson` pasa a tener `status`, igual que `Student`, `User` y `Course`.
-- Ninguna fila existente se borró nunca por esta vía (la FK lo impedía), así que
-- todas arrancan en ACTIVE y no hace falta backfill.
ALTER TABLE "Lesson" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'ACTIVE';

-- Toda consulta de clases filtra por curso y ahora también por estado. Es la
-- lectura más frecuente del módulo académico: el listado del curso, el calendario,
-- la asistencia, las notas y la liquidación de sueldos pasan por acá.
CREATE INDEX "Lesson_courseId_status_idx" ON "Lesson"("courseId", "status");
