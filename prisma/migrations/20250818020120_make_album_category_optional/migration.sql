-- DropForeignKey
ALTER TABLE "public"."Album" DROP CONSTRAINT "Album_categoryId_fkey";

-- AlterTable
ALTER TABLE "public"."Album" ALTER COLUMN "categoryId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."Album" ADD CONSTRAINT "Album_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
