import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSessionByToken, getUserById } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const store = await cookies();
  const token = store.get("session")?.value;
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await getSessionByToken(token);
  if (!session || Date.now() > session.expiresAt) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserById(session.userId);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ user }, { status: 200, headers: { "Cache-Control": "no-store" } });
}
