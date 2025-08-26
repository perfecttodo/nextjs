import { prisma } from "@/lib/prisma";
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

export async function nextIDStr() {
  const result = await prisma.$queryRaw<{ next_val: bigint }[]>
    `SELECT nextval('id_seq') as next_val`;
  return result[0].next_val.toString();
}

export async function login(id: string, email: string, name: string, req: Request) {
    // Issue JWT token
    const secret = new TextEncoder().encode(
      process.env.NEXTAUTH_SECRET || 'dev-secret'
    );
    const token = await new SignJWT({
      sub: id,
      email: email,
      name: name,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .setIssuedAt()
      .sign(secret);

      const signInUrl = new URL('/my/submit/episode', req.url);

    const res = NextResponse.redirect(signInUrl);
    res.cookies.set('app_session', token, {
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
}