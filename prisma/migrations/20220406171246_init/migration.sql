-- CreateEnum
CREATE TYPE "Continent" AS ENUM ('AFRICA', 'ASIA', 'AUSTRALIA', 'EUROPE', 'NORTH_AMERICA', 'SOUTH_AMERICA');

-- CreateTable
CREATE TABLE "Invite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "user_agent" TEXT NOT NULL,
    "high_school" BOOLEAN NOT NULL,
    "welcome_message" TEXT NOT NULL,
    "continent" "Continent" NOT NULL,

    CONSTRAINT "Invite_pkey" PRIMARY KEY ("id")
);
