-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('PAYMENT', 'EXPENSE', 'PAYROLL', 'REFUND', 'MISC_INCOME', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('VALID', 'VOIDED');

-- AlterTable
ALTER TABLE "Expense" ADD COLUMN     "status" "TransactionStatus" NOT NULL DEFAULT 'VALID';

-- Safely Create MiscellaneousIncome table if it was skipped in previous migrations
CREATE TABLE IF NOT EXISTS "MiscellaneousIncome" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "date" DATE NOT NULL,
    "category" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "ticketNumber" TEXT,
    "instituteId" TEXT NOT NULL,
    "studentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MiscellaneousIncome_pkey" PRIMARY KEY ("id")
);

-- Safely Add column "status"
ALTER TABLE "MiscellaneousIncome" ADD COLUMN IF NOT EXISTS "status" "TransactionStatus" NOT NULL DEFAULT 'VALID';

-- Safely Add Indexes
CREATE INDEX IF NOT EXISTS "MiscellaneousIncome_instituteId_idx" ON "MiscellaneousIncome"("instituteId");
CREATE INDEX IF NOT EXISTS "MiscellaneousIncome_studentId_idx" ON "MiscellaneousIncome"("studentId");

-- Safely Add Foreign Keys
ALTER TABLE "MiscellaneousIncome" DROP CONSTRAINT IF EXISTS "MiscellaneousIncome_instituteId_fkey";
ALTER TABLE "MiscellaneousIncome" ADD CONSTRAINT "MiscellaneousIncome_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MiscellaneousIncome" DROP CONSTRAINT IF EXISTS "MiscellaneousIncome_studentId_fkey";
ALTER TABLE "MiscellaneousIncome" ADD CONSTRAINT "MiscellaneousIncome_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

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

