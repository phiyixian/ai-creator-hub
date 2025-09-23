import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createUser, findUserByEmail } from "@/lib/db";
import { createUserSession, hashPassword } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json().catch(() => ({ email: "", password: "", name: "" }));
  if (!email || !password) {
    return new Response(JSON.stringify({ error: "Email and password required" }), { status: 400 });
  }
  const existing = findUserByEmail(String(email).toLowerCase());
  if (existing) {
    return new Response(JSON.stringify({ error: "Account already exists" }), { status: 400 });
  }
  const passwordHash = await hashPassword(password);
  const user = createUser(String(email).toLowerCase(), name || null, passwordHash);
  const session = createUserSession(user.id);
  const cookieStore = cookies();
  cookieStore.set("session", session.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(session.expiresAt),
  });
  return Response.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
}

