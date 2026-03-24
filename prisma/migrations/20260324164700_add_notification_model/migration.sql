-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "instituteId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_instituteId_read_idx" ON "Notification"("instituteId", "read");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_instituteId_fkey" FOREIGN KEY ("instituteId") REFERENCES "Institute"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Enable Supabase Realtime
ALTER TABLE "Notification" REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";

-- Grants required for Supabase Realtime postgres_changes to broadcast events
GRANT SELECT ON "Notification" TO anon, authenticated;

-- RLS required for Supabase Realtime to authorize event delivery to anon clients
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read for realtime" ON "Notification"
  FOR SELECT TO anon, authenticated USING (true);

