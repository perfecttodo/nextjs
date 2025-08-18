-- CreateTable
CREATE TABLE "public"."Label" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT,
    "description" TEXT,
    "ownerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Label_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_AudioFileToLabel" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AudioFileToLabel_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "Label_ownerId_idx" ON "public"."Label"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Label_name_ownerId_key" ON "public"."Label"("name", "ownerId");

-- CreateIndex
CREATE INDEX "_AudioFileToLabel_B_index" ON "public"."_AudioFileToLabel"("B");

-- AddForeignKey
ALTER TABLE "public"."Label" ADD CONSTRAINT "Label_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AudioFileToLabel" ADD CONSTRAINT "_AudioFileToLabel_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Episode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_AudioFileToLabel" ADD CONSTRAINT "_AudioFileToLabel_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."Label"("id") ON DELETE CASCADE ON UPDATE CASCADE;
