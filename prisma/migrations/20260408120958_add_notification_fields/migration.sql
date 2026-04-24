-- AlterTable
ALTER TABLE "User" ADD COLUMN     "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pushEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "smsEnabled" BOOLEAN NOT NULL DEFAULT false;
