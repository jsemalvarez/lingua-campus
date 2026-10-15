-- El armado de la clase (PED-09). Tabla nueva, sin tocar las existentes.

-- CreateTable
CREATE TABLE "LessonPlan" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "focus" TEXT,
    "words" JSONB NOT NULL DEFAULT '[]',
    "moments" JSONB,
    "ideasBasis" TEXT,
    "chosen" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LessonPlan_lessonId_key" ON "LessonPlan"("lessonId");

-- AddForeignKey
ALTER TABLE "LessonPlan" ADD CONSTRAINT "LessonPlan_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
