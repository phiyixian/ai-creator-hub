import { cookies } from "next/headers";
import { deleteSessionByToken } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const cookieStore = cookies();
  const token = cookieStore.get("session")?.value;
  if (token) {
    try {
      deleteSessionByToken(token);
    } catch {}
  }
  cookieStore.delete("session");
  return new Response(null, { status: 302, headers: { Location: "/" } });
}

