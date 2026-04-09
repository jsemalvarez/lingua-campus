-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "expenseId" TEXT;

-- AddForeignKey
ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;
