-- Registro de actividad diaria para el panel de uso (FEAT-11).
--
-- Tabla nueva y nada más: no toca ninguna fila existente ni ninguna otra tabla.

-- CreateTable
CREATE TABLE "ActivityDay" (
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "instituteId" TEXT,
    "day" DATE NOT NULL,
    "roles" TEXT[],
    "logins" INTEGER NOT NULL DEFAULT 0,
    "sections" TEXT[],
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityDay_pkey" PRIMARY KEY ("subjectType","subjectId","day")
);

-- CreateIndex
CREATE INDEX "ActivityDay_instituteId_day_idx" ON "ActivityDay"("instituteId", "day");
