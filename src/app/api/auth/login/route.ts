import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { findUserByEmail } from "@/lib/db";
import { createUserSession, verifyPassword } from "@/lib/utils";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json().catch(() => ({ email: "", password: "" }));
  if (!email || !password) {
    return new Response(JSON.stringify({ error: "Email and password required" }), { status: 400 });
  }
  const user = findUserByEmail(String(email).toLowerCase());
  if (!user) {
    return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return new Response(JSON.stringify({ error: "Invalid credentials" }), { status: 401 });
  }
  const session = createUserSession(user.id);
  const cookieStore = await cookies();
  cookieStore.set("session", session.token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(session.expiresAt),
  });
  return Response.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } });
}

