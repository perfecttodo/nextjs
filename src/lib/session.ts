import { cookies } from "next/headers";
import { jwtVerify } from "jose";

export interface SessionUser {
  sub: string;
  email: string;
  name?: string;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("app_session")?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || "dev-secret");
    const { payload } = await jwtVerify(token, secret);
    return { sub: String(payload.sub), email: String(payload.email), name: payload.name as string | undefined };
  } catch {
    return null;
  }
}


