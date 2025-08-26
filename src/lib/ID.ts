import { prisma } from "@/lib/prisma";

export async function nextIDStr() {
  const result = await prisma.$queryRaw<{ next_val: bigint }[]>
    `SELECT nextval('id_seq') as next_val`;
  return result[0].next_val.toString();
}