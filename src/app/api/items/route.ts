import { NextRequest, NextResponse } from "next/server";
import { createItem, getAllItems } from "@/lib/itemsStore";
import { getSessionUser } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  const items = await getAllItems(user?.sub);
  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || typeof body.name !== "string" || body.name.trim() === "") {
      return NextResponse.json({ error: "name is required" }, { status: 400 });
    }
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const item = await createItem({
      name: body.name,
      description: typeof body.description === "string" ? body.description : undefined,
      status: body.status === "todo" || body.status === "in-progress" || body.status === "done" ? body.status : undefined,
      ownerId: user.sub,
    });
    return NextResponse.json(item, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
}


