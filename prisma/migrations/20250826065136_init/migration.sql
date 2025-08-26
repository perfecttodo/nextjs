/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Album` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "public"."Album_categoryId_idx";

-- AlterTable
ALTER TABLE "public"."Album" DROP COLUMN "categoryId";
