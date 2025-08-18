/*
  Warnings:

  - The values [x-m4a] on the enum `AudioFormat` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."AudioFormat_new" AS ENUM ('mp3', 'm4a', 'wav', 'ogg', 'webm');
ALTER TABLE "public"."Episode" ALTER COLUMN "format" TYPE "public"."AudioFormat_new" USING ("format"::text::"public"."AudioFormat_new");
ALTER TYPE "public"."AudioFormat" RENAME TO "AudioFormat_old";
ALTER TYPE "public"."AudioFormat_new" RENAME TO "AudioFormat";
DROP TYPE "public"."AudioFormat_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "githubId" TEXT,
ADD COLUMN     "password" TEXT;

-- CreateIndex
CREATE INDEX "User_githubId_idx" ON "public"."User"("githubId");
