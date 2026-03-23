-- CreateEnum
CREATE TYPE "InstitutePlan" AS ENUM ('BASIC', 'STANDARD', 'PREMIUM');

-- AlterTable
ALTER TABLE "Institute" ADD COLUMN     "plan" "InstitutePlan" NOT NULL DEFAULT 'BASIC',
ADD COLUMN     "pwaIcon192" TEXT,
ADD COLUMN     "pwaIcon512" TEXT;
