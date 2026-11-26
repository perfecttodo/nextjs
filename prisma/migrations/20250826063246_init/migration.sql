-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('todo', 'in_progress', 'done');

-- CreateEnum
CREATE TYPE "public"."AudioStatus" AS ENUM ('draft', 'published');

-- CreateTable
CREATE TABLE "public"."TestingItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."Status" NOT NULL DEFAULT 'todo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT,

    CONSTRAINT "TestingItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "githubId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Album" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "ownerId" TEXT NOT NULL,
    "categoryId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Album_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Episode" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "blobUrl" TEXT NOT NULL,
    "blobId" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "duration" INTEGER,
    "fileSize" INTEGER NOT NULL,
    "status" "public"."AudioStatus" NOT NULL DEFAULT 'draft',
    "language" TEXT,
    "description" TEXT,
    "originalWebsite" TEXT,
    "ownerId" TEXT NOT NULL,
    "albumId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_githubId_key" ON "public"."User"("githubId");

-- CreateIndex
CREATE INDEX "User_githubId_idx" ON "public"."User"("githubId");

-- CreateIndex
CREATE INDEX "Album_ownerId_idx" ON "public"."Album"("ownerId");

-- CreateIndex
CREATE INDEX "Album_categoryId_idx" ON "public"."Album"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Album_name_ownerId_key" ON "public"."Album"("name", "ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Episode_blobId_key" ON "public"."Episode"("blobId");

-- CreateIndex
CREATE INDEX "Episode_status_createdAt_idx" ON "public"."Episode"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Episode_ownerId_idx" ON "public"."Episode"("ownerId");

-- CreateIndex
CREATE INDEX "Episode_albumId_idx" ON "public"."Episode"("albumId");

-- AddForeignKey
ALTER TABLE "public"."TestingItem" ADD CONSTRAINT "TestingItem_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Album" ADD CONSTRAINT "Album_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Episode" ADD CONSTRAINT "Episode_albumId_fkey" FOREIGN KEY ("albumId") REFERENCES "public"."Album"("id") ON DELETE SET NULL ON UPDATE CASCADE;
