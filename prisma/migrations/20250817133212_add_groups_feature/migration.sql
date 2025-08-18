-- AlterTable
ALTER TABLE "public"."Episode" ADD COLUMN     "groupId" TEXT;

-- CreateTable
CREATE TABLE "public"."Group" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Group_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Group_ownerId_idx" ON "public"."Group"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Group_name_ownerId_key" ON "public"."Group"("name", "ownerId");

-- CreateIndex
CREATE INDEX "AudioFile_groupId_idx" ON "public"."Episode"("groupId");

-- AddForeignKey
ALTER TABLE "public"."Group" ADD CONSTRAINT "Group_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Episode" ADD CONSTRAINT "AudioFile_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "public"."Group"("id") ON DELETE SET NULL ON UPDATE CASCADE;
