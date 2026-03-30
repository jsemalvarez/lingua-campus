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

-- Enable Supabase Realtime (Conditional)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER TABLE "Notification" REPLICA IDENTITY FULL;
    ALTER PUBLICATION supabase_realtime ADD TABLE "Notification";
  END IF;
END $$;

-- Grants and RLS for Supabase Realtime (Conditional)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    GRANT SELECT ON "Notification" TO anon, authenticated;
    ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE polname = 'Allow read for realtime') THEN
      CREATE POLICY "Allow read for realtime" ON "Notification"
        FOR SELECT TO anon, authenticated USING (true);
    END IF;
  END IF;
END $$;

