import { NextResponse, NextRequest } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { SignJWT } from "jose";
import { prisma } from "@/lib/prisma";
import { nextIDStr } from "@/lib/ID";

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

    // Issue a simple session JWT cookie (httpOnly) for demo purposes
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "dev-secret");
    const githubId = `google:${payload.sub}`;

    const token = await new SignJWT({ sub: githubId, email: payload.email, name: payload.name })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("7d")
      .setIssuedAt()
      .sign(secret);

    // ensure user exists
    await prisma.user.upsert({
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

    const res = NextResponse.json({ ok: true });
    res.cookies.set("app_session", token, {
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (e) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}


