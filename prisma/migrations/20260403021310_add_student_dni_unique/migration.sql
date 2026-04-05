/*
  Warnings:

  - A unique constraint covering the columns `[dni,instituteId]` on the table `Student` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Student_dni_instituteId_key" ON "Student"("dni", "instituteId");
