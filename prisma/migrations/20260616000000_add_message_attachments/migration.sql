-- Migration: add_message_attachments
-- Adds optional file attachment and shared link fields to the Message table.
-- All columns are nullable — no existing data is affected.

ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "attachmentPath" TEXT;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "attachmentName" TEXT;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "attachmentMime" TEXT;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "attachmentSize" INTEGER;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "sharedUrl" TEXT;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "sharedUrlTitle" TEXT;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "sharedUrlDesc" TEXT;
ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "sharedUrlImage" TEXT;
