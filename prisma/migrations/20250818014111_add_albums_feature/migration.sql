-- AlterTable
ALTER TABLE "public"."AudioFile" ADD COLUMN     "albumId" TEXT;

-- CreateTable
CREATE TABLE "public"."Album" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "ownerId" TEXT NOT NULL,
    "groupId" TEXT,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Album_ownerId_idx" ON "public"."Album"("ownerId");

-- CreateIndex
CREATE INDEX "Album_groupId_idx" ON "public"."Album"("groupId");

-- CreateIndex
CREATE INDEX "Album_categoryId_idx" ON "public"."Album"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Album_name_ownerId_key" ON "public"."Album"("name", "ownerId");

-- CreateIndex
CREATE INDEX "AudioFile_albumId_idx" ON "public"."AudioFile"("albumId");

-- AddForeignKey
ALTER TABLE "public"."Album" ADD CONSTRAINT "Album_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Album" ADD CONSTRAINT "Album_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Album" ADD CONSTRAINT "Album_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AudioFile" ADD CONSTRAINT "AudioFile_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "public"."Album"("id") ON DELETE SET NULL ON UPDATE CASCADE;
