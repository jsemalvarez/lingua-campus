-- AlterTable
ALTER TABLE "StudentReport" ADD COLUMN     "contentHash" TEXT,
ADD COLUMN     "deliveredOtherAt" TIMESTAMP(3),
ADD COLUMN     "deliveredOtherById" TEXT,
ADD COLUMN     "deliveredOtherNote" TEXT,
ADD COLUMN     "lastEditedAt" TIMESTAMP(3),
ADD COLUMN     "lastEditedById" TEXT;

-- CreateTable
CREATE TABLE "SignatureReference" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "userId" TEXT,
    "studentId" TEXT,
    "strokeData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SignatureReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReportSigner" (
    "id" TEXT NOT NULL,
    "reportId" TEXT NOT NULL,
    "userId" TEXT,
    "studentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReportSigner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Signature" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "reportId" TEXT,
    "userId" TEXT,
    "studentId" TEXT,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contentHash" TEXT NOT NULL,
    "strokeData" JSONB,
    "similarityScore" DOUBLE PRECISION,

    CONSTRAINT "Signature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SignatureReference_userId_key" ON "SignatureReference"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SignatureReference_studentId_key" ON "SignatureReference"("studentId");

-- CreateIndex
CREATE INDEX "ReportSigner_reportId_idx" ON "ReportSigner"("reportId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportSigner_reportId_userId_key" ON "ReportSigner"("reportId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReportSigner_reportId_studentId_key" ON "ReportSigner"("reportId", "studentId");

-- CreateIndex
CREATE INDEX "Signature_reportId_idx" ON "Signature"("reportId");

-- CreateIndex
CREATE INDEX "Signature_instituteId_signedAt_idx" ON "Signature"("instituteId", "signedAt");

-- AddForeignKey
ALTER TABLE "SignatureReference" ADD CONSTRAINT "SignatureReference_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureReference" ADD CONSTRAINT "SignatureReference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SignatureReference" ADD CONSTRAINT "SignatureReference_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportSigner" ADD CONSTRAINT "ReportSigner_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "StudentReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportSigner" ADD CONSTRAINT "ReportSigner_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportSigner" ADD CONSTRAINT "ReportSigner_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signature" ADD CONSTRAINT "Signature_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signature" ADD CONSTRAINT "Signature_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "StudentReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signature" ADD CONSTRAINT "Signature_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signature" ADD CONSTRAINT "Signature_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
