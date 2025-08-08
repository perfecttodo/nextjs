import { promises as fs } from "fs";
import path from "path";

export type TestingItemStatus = "todo" | "in-progress" | "done";

export interface TestingItem {
  id: string;
  name: string;
  description?: string;
  status: TestingItemStatus;
  createdAt: string; // ISO
  updatedAt: string; // ISO
}

const dataDir = path.join(process.cwd(), "data");
const dataFilePath = path.join(dataDir, "items.json");

async function ensureDataFile(): Promise<void> {
  await fs.mkdir(dataDir, { recursive: true });
  try {
    await fs.access(dataFilePath);
  } catch {
    await fs.writeFile(dataFilePath, JSON.stringify([], null, 2), "utf-8");
  }
}

async function readAll(): Promise<TestingItem[]> {
  await ensureDataFile();
  const json = await fs.readFile(dataFilePath, "utf-8");
  try {
    const items: TestingItem[] = JSON.parse(json);
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

async function writeAll(items: TestingItem[]): Promise<void> {
  await ensureDataFile();
  await fs.writeFile(dataFilePath, JSON.stringify(items, null, 2), "utf-8");
}

export async function getAllItems(): Promise<TestingItem[]> {
  const items = await readAll();
  // Sort newest first
  return items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getItemById(id: string): Promise<TestingItem | undefined> {
  const items = await readAll();
  return items.find((i) => i.id === id);
}

export async function createItem(input: {
  name: string;
  description?: string;
  status?: TestingItemStatus;
}): Promise<TestingItem> {
  const items = await readAll();
  const now = new Date().toISOString();
  const item: TestingItem = {
    id: crypto.randomUUID(),
    name: input.name,
    description: input.description?.trim() || undefined,
    status: input.status ?? "todo",
    createdAt: now,
    updatedAt: now,
  };
  items.push(item);
  await writeAll(items);
  return item;
}

export async function updateItem(
  id: string,
  updates: Partial<Pick<TestingItem, "name" | "description" | "status">>
): Promise<TestingItem | undefined> {
  const items = await readAll();
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) return undefined;
  const next: TestingItem = {
    ...items[index],
    ...updates,
    description: updates.description?.trim() ?? items[index].description,
    updatedAt: new Date().toISOString(),
  };
  items[index] = next;
  await writeAll(items);
  return next;
}

export async function deleteItem(id: string): Promise<boolean> {
  const items = await readAll();
  const next = items.filter((i) => i.id !== id);
  const changed = next.length !== items.length;
  if (changed) {
    await writeAll(next);
  }
  return changed;
}


