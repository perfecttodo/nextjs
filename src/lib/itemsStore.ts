import { prisma } from "@/lib/prisma";

export type TestingItemStatus = "todo" | "in-progress" | "done";

export interface TestingItem {
  id: string;
  name: string;
  description?: string;
  status: TestingItemStatus;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

export async function getAllItems(ownerId?: string): Promise<TestingItem[]> {
  if (!ownerId) return [];
  const rows = await prisma.testingItem.findMany({
    where: { ownerId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapRowToItem);
}

export async function getItemById(id: string, ownerId?: string): Promise<TestingItem | undefined> {
  if (!ownerId) return undefined;
  const row = await prisma.testingItem.findFirst({ where: { id, ownerId } });
  return row ? mapRowToItem(row) : undefined;
}

export async function createItem(input: {
  name: string;
  description?: string;
  status?: TestingItemStatus;
  ownerId?: string;
}): Promise<TestingItem> {
  const row = await prisma.testingItem.create({
    data: {
      name: input.name,
      description: input.description?.trim() || null,
      status: mapStatusToEnum(input.status ?? "todo"),
      ownerId: input.ownerId ?? null,
    },
  });
  return mapRowToItem(row);
}

export async function updateItem(
  id: string,
  updates: Partial<Pick<TestingItem, "name" | "description" | "status">>,
  ownerId?: string
): Promise<TestingItem | undefined> {
  try {
    if (!ownerId) return undefined;
    const result = await prisma.testingItem.updateMany({
      where: { id, ownerId },
      data: {
        name: updates.name,
        description:
          updates.description !== undefined ? updates.description?.trim() || null : undefined,
        status: updates.status ? mapStatusToEnum(updates.status) : undefined,
      },
    });
    if (result.count === 0) return undefined;
    const after = await prisma.testingItem.findFirst({ where: { id, ownerId } });
    return after ? mapRowToItem(after) : undefined;
  } catch {
    return undefined;
  }
}

export async function deleteItem(id: string, ownerId?: string): Promise<boolean> {
  try {
    if (!ownerId) return false;
    const result = await prisma.testingItem.deleteMany({ where: { id, ownerId } });
    return result.count > 0;
  } catch {
    return false;
  }
}

// Helpers
function mapStatusToEnum(status: TestingItemStatus) {
  if (status === "in-progress") return "in_progress" as const;
  if (status === "done") return "done" as const;
  return "todo" as const;
}

function mapEnumToStatus(status: "todo" | "in_progress" | "done"): TestingItemStatus {
  if (status === "in_progress") return "in-progress";
  return status;
}

function mapRowToItem(row: any): TestingItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    status: mapEnumToStatus(row.status),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}


