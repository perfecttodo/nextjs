/*
  Warnings:

  - You are about to drop the column `blobId` on the `Episode` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Episode_blobId_key";

-- AlterTable
ALTER TABLE "public"."Episode" DROP COLUMN "blobId";
