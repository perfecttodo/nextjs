import { NextResponse, NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  const url = new URL("/items?loggedOut=1", req.url);
  const res = NextResponse.redirect(url, { status: 303 });
  res.cookies.set("app_session", "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}

export async function POST(req: NextRequest) {


  const signInUrl = new URL('/', req.url);

  const res = NextResponse.redirect(signInUrl);

  // Clear the session cookie
  res.cookies.set('app_session', '', {
    httpOnly: true,
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0, // Expire immediately
  });




  return res;
}


