-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "recipientId" TEXT;

-- CreateIndex
CREATE INDEX "Expense_recipientId_idx" ON "Expense"("recipientId");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
