/*
  Warnings:

  - You are about to drop the column `amount` on the `Fee` table. All the data in the column will be lost.
  - Added the required column `originalAmount` to the `Fee` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FeeType" AS ENUM ('MONTHLY', 'ENROLLMENT');

-- AlterEnum
ALTER TYPE "PaymentStatus" ADD VALUE 'PARTIAL';

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "enrollmentPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "monthlyPrice" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "customEnrollmentPrice" DOUBLE PRECISION,
ADD COLUMN     "customMonthlyPrice" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "Fee" DROP COLUMN "amount",
ADD COLUMN     "enrollmentId" TEXT,
ADD COLUMN     "originalAmount" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "type" "FeeType" NOT NULL DEFAULT 'MONTHLY';

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "feeId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "method" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Fee" ADD CONSTRAINT "Fee_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_feeId_fkey" FOREIGN KEY ("feeId") REFERENCES "Fee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
