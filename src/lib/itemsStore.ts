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

export async function getAllItems(): Promise<TestingItem[]> {
  const rows = await prisma.testingItem.findMany({
    orderBy: { createdAt: "desc" },
  });
  return rows.map(mapRowToItem);
}

export async function getItemById(id: string): Promise<TestingItem | undefined> {
  const row = await prisma.testingItem.findUnique({ where: { id } });
  return row ? mapRowToItem(row) : undefined;
}

export async function createItem(input: {
  name: string;
  description?: string;
  status?: TestingItemStatus;
}): Promise<TestingItem> {
  const row = await prisma.testingItem.create({
    data: {
      name: input.name,
      description: input.description?.trim() || null,
      status: mapStatusToEnum(input.status ?? "todo"),
    },
  });
  return mapRowToItem(row);
}

export async function updateItem(
  id: string,
  updates: Partial<Pick<TestingItem, "name" | "description" | "status">>
): Promise<TestingItem | undefined> {
  try {
    const row = await prisma.testingItem.update({
      where: { id },
      data: {
        name: updates.name,
        description:
          updates.description !== undefined ? updates.description?.trim() || null : undefined,
        status: updates.status ? mapStatusToEnum(updates.status) : undefined,
      },
    });
    return mapRowToItem(row);
  } catch {
    return undefined;
  }
}

export async function deleteItem(id: string): Promise<boolean> {
  try {
    await prisma.testingItem.delete({ where: { id } });
    return true;
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


