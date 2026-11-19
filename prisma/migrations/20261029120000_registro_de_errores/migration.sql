-- ARQ-09: registro de errores. Tres tablas nuevas, sin tocar nada existente.

-- CreateTable
CREATE TABLE "ErrorIssue" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "area" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "count" INTEGER NOT NULL DEFAULT 0,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "ErrorIssue_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ErrorIssueScope" (
    "issueId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notifiedAt" TIMESTAMP(3),

    CONSTRAINT "ErrorIssueScope_pkey" PRIMARY KEY ("issueId","scope")
);

-- CreateTable
CREATE TABLE "ErrorEvent" (
    "id" TEXT NOT NULL,
    "issueId" TEXT NOT NULL,
    "instituteId" TEXT,
    "subjectType" TEXT,
    "subjectId" TEXT,
    "role" TEXT,
    "shownToUser" BOOLEAN NOT NULL DEFAULT true,
    "path" TEXT,
    "context" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ErrorEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ErrorIssue_fingerprint_key" ON "ErrorIssue"("fingerprint");

-- CreateIndex
CREATE INDEX "ErrorIssue_status_lastSeenAt_idx" ON "ErrorIssue"("status", "lastSeenAt");

-- CreateIndex
CREATE INDEX "ErrorIssue_area_status_idx" ON "ErrorIssue"("area", "status");

-- CreateIndex
CREATE INDEX "ErrorEvent_issueId_createdAt_idx" ON "ErrorEvent"("issueId", "createdAt");

-- CreateIndex
CREATE INDEX "ErrorEvent_createdAt_idx" ON "ErrorEvent"("createdAt");

-- AddForeignKey
ALTER TABLE "ErrorIssueScope" ADD CONSTRAINT "ErrorIssueScope_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "ErrorIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ErrorEvent" ADD CONSTRAINT "ErrorEvent_issueId_fkey" FOREIGN KEY ("issueId") REFERENCES "ErrorIssue"("id") ON DELETE CASCADE ON UPDATE CASCADE;
