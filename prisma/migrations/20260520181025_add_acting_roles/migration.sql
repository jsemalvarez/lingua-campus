-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "senderRole" TEXT;

-- AlterTable
ALTER TABLE "ThreadParticipant" ADD COLUMN     "actingRole" TEXT;
