-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('todo', 'in_progress', 'done');

-- CreateTable
CREATE TABLE "public"."TestingItem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "public"."Status" NOT NULL DEFAULT 'todo',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestingItem_pkey" PRIMARY KEY ("id")
);
