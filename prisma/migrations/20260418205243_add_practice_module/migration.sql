-- CreateEnum
CREATE TYPE "PracticeType" AS ENUM ('SPEAKING', 'LISTENING', 'CHAT');

-- CreateTable
CREATE TABLE "LessonPractice" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "speakingPhrases" TEXT[],
    "listeningText" TEXT,
    "chatScenario" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonPractice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PracticeSession" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "lessonPracticeId" TEXT NOT NULL,
    "type" "PracticeType" NOT NULL,
    "phrasesAttempted" INTEGER NOT NULL DEFAULT 0,
    "phrasesCorrect" INTEGER NOT NULL DEFAULT 0,
    "accuracyPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "weakArea" TEXT,
    "durationSeconds" INTEGER NOT NULL DEFAULT 0,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PracticeSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LessonPractice_lessonId_key" ON "LessonPractice"("lessonId");

-- CreateIndex
CREATE INDEX "LessonPractice_lessonId_idx" ON "LessonPractice"("lessonId");

-- CreateIndex
CREATE INDEX "PracticeSession_studentId_idx" ON "PracticeSession"("studentId");

-- CreateIndex
CREATE INDEX "PracticeSession_lessonId_idx" ON "PracticeSession"("lessonId");

-- CreateIndex
CREATE INDEX "PracticeSession_studentId_lessonId_idx" ON "PracticeSession"("studentId", "lessonId");

-- AddForeignKey
ALTER TABLE "LessonPractice" ADD CONSTRAINT "LessonPractice_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PracticeSession" ADD CONSTRAINT "PracticeSession_lessonPracticeId_fkey" FOREIGN KEY ("lessonPracticeId") REFERENCES "LessonPractice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
