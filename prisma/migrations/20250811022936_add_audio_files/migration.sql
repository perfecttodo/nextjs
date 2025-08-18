-- CreateEnum
CREATE TYPE "public"."AudioFormat" AS ENUM ('mp3', 'm4a', 'wav', 'ogg', 'webm');

-- CreateEnum
CREATE TYPE "public"."AudioStatus" AS ENUM ('draft', 'published');

-- CreateTable
CREATE TABLE "public"."Episode" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "blobId" TEXT NOT NULL,
    "format" "public"."AudioFormat" NOT NULL,
    "duration" INTEGER,
    "fileSize" INTEGER NOT NULL,
    "status" "public"."AudioStatus" NOT NULL DEFAULT 'draft',
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AudioFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AudioFile_blobUrl_key" ON "public"."Episode"("blobUrl");

-- CreateIndex
CREATE UNIQUE INDEX "AudioFile_blobId_key" ON "public"."Episode"("blobId");

-- CreateIndex
CREATE INDEX "AudioFile_status_createdAt_idx" ON "public"."Episode"("status", "createdAt");

-- CreateIndex
CREATE INDEX "AudioFile_ownerId_idx" ON "public"."Episode"("ownerId");

-- AddForeignKey
ALTER TABLE "public"."Episode" ADD CONSTRAINT "AudioFile_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
