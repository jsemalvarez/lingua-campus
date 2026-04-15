-- AlterEnum
ALTER TYPE "FeeType" ADD VALUE 'EXAM';

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "examPrice" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "customExamPrice" DOUBLE PRECISION,
ADD COLUMN     "takesExam" BOOLEAN NOT NULL DEFAULT false;
