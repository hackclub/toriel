-- CreateEnum
CREATE TYPE "Stage" AS ENUM ('INITIALIZED', 'STARTED_FLOW', 'ACCEPTED_COC', 'FINISHED');

-- AlterTable
ALTER TABLE "Invite" ADD COLUMN     "event" TEXT,
ADD COLUMN     "schedule_stuck_message_id" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "toriel_stage" "Stage" NOT NULL DEFAULT 'INITIALIZED';
