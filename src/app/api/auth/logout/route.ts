import { NextResponse, NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const url = new URL("/items?loggedOut=1", req.url);
  const res = NextResponse.redirect(url, { status: 303 });
  res.cookies.set("app_session", "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}


