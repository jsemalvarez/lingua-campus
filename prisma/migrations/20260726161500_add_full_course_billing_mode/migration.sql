-- CreateEnum
CREATE TYPE "BillingMode" AS ENUM ('MONTHLY', 'FULL_COURSE');

-- AlterEnum
ALTER TYPE "FeeType" ADD VALUE 'FULL_COURSE';

-- AlterTable
ALTER TABLE "Enrollment" ADD COLUMN     "billingMode" "BillingMode" NOT NULL DEFAULT 'MONTHLY',
ADD COLUMN     "customFullCoursePrice" DOUBLE PRECISION;
