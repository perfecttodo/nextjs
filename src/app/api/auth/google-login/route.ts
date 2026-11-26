import { NextResponse, NextRequest } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "@/lib/prisma";
import { nextIDStr,login } from "@/lib/ID";

const client = new OAuth2Client();

export async function POST(req: NextRequest) {
  try {
    const { credential } = await req.json();
    if (!credential) return NextResponse.json({ error: "Missing credential" }, { status: 400 });

    const ticket = await client.verifyIdToken({ idToken: credential });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const githubId = `google:${payload.sub}`;
   const user =  await prisma.user.upsert({
      where: { githubId},
      create: {
        id: await nextIDStr(),
        githubId,
        email: payload.email,
        name: payload.name || null,
        emailVerified:true
      },
      update: {
        email: payload.email,
        name: payload.name || null,
      },
    });

    return login(user.id, user.email || '', user.name||'', req);

  } catch (e) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}


