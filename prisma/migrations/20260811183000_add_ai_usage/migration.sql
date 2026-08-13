-- SEC-07 · Límite de uso de los endpoints de IA.
--
-- Los seis endpoints de `/api/practice` sólo verificaban que hubiera sesión, así
-- que cualquier usuario autenticado podía llamarlos en loop contra la cuenta de
-- Gemini del proyecto. Hace falta un contador para poder cortar.
--
-- Va a la base y no a memoria del proceso: en Vercel cada instancia serverless
-- tendría su propio contador y el tope se multiplicaría por la cantidad de
-- instancias, además de reiniciarse en cada arranque en frío. Son dos escrituras
-- más por llamada de IA, sobre una operación que ya tarda uno o dos segundos.
--
-- Sin claves foráneas a propósito: la fila es un contador, no un dato del
-- negocio. Dar de baja a un alumno no tiene por qué fallar por su uso de IA.
CREATE TABLE "AiUsage" (
    "id" TEXT NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "AiUsage_pkey" PRIMARY KEY ("id")
);

-- El único acceso de lectura/escritura es el upsert del contador, que necesita
-- que la terna sea única para que dos llamadas simultáneas del mismo alumno
-- incrementen la misma fila en vez de crear dos.
CREATE UNIQUE INDEX "AiUsage_subjectType_subjectId_windowStart_key" ON "AiUsage"("subjectType", "subjectId", "windowStart");

-- Las ventanas vencidas no se leen nunca más; se podan cada tanto por este índice.
CREATE INDEX "AiUsage_windowStart_idx" ON "AiUsage"("windowStart");
