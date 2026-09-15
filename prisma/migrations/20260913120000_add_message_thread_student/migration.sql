-- FEAT-06: el hilo guarda de qué alumno habla.
-- La columna es opcional y arranca en NULL para los 27 hilos que ya existen:
-- no se rellena hacia atrás porque el dato no se puede reconstruir con
-- certeza (el curso más el autor sólo lo deducen, y falla con hermanos en el
-- mismo curso). Los hilos viejos quedan sin sujeto, que es la verdad.

-- AlterTable
ALTER TABLE "MessageThread" ADD COLUMN     "studentId" TEXT;

-- CreateIndex
CREATE INDEX "MessageThread_studentId_idx" ON "MessageThread"("studentId");

-- CreateIndex
CREATE INDEX "MessageThread_courseId_idx" ON "MessageThread"("courseId");

-- AddForeignKey
ALTER TABLE "MessageThread" ADD CONSTRAINT "MessageThread_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
