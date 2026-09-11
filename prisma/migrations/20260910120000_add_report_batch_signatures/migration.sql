-- CreateTable
CREATE TABLE "ReportBatchSignature" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "periodIndex" INTEGER NOT NULL,
    "signerRole" TEXT NOT NULL,
    "userId" TEXT,
    "signerName" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "contentHashes" JSONB NOT NULL,
    "strokeData" JSONB,

    CONSTRAINT "ReportBatchSignature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReportBatchSignature_courseId_templateId_year_periodIndex_s_key" ON "ReportBatchSignature"("courseId", "templateId", "year", "periodIndex", "signerRole");

-- CreateIndex
CREATE INDEX "ReportBatchSignature_instituteId_signedAt_idx" ON "ReportBatchSignature"("instituteId", "signedAt");

-- AddForeignKey
ALTER TABLE "ReportBatchSignature" ADD CONSTRAINT "ReportBatchSignature_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportBatchSignature" ADD CONSTRAINT "ReportBatchSignature_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportBatchSignature" ADD CONSTRAINT "ReportBatchSignature_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ReportTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReportBatchSignature" ADD CONSTRAINT "ReportBatchSignature_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
