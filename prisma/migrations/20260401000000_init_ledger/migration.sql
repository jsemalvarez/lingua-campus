-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('PAYMENT', 'EXPENSE', 'PAYROLL', 'REFUND', 'MISC_INCOME', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('VALID', 'VOIDED');

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'VALID';

-- AlterTable
ALTER TABLE "MiscellaneousIncome" ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'VALID';

-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'VALID';

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "creditBalance" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "type" "TransactionType" NOT NULL,
    "method" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "TransactionStatus" NOT NULL DEFAULT 'VALID',
    "description" TEXT,
    "paymentId" TEXT,
    "expenseId" TEXT,
    "miscIncomeId" TEXT,
    "operatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Transaction_instituteId_idx" ON "Transaction"("instituteId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_miscIncomeId_fkey" FOREIGN KEY ("miscIncomeId") REFERENCES "MiscellaneousIncome"("id") ON DELETE SET NULL ON UPDATE CASCADE;

