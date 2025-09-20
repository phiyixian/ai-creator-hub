import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { deleteSessionByToken } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get("session")?.value;
  if (token) {
    try { deleteSessionByToken(token); } catch {}
  }
  cookieStore.set("session", "", { httpOnly: true, sameSite: "lax", path: "/", expires: new Date(0) });
  return Response.json({ ok: true });
}

