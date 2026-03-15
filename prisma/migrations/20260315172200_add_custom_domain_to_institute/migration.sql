-- AlterTable
ALTER TABLE "Institute" ADD COLUMN     "customDomain" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Institute_customDomain_key" ON "Institute"("customDomain");
