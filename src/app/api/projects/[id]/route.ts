import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const id = Number(params.id);
  if (!id) return new Response(JSON.stringify({ error: "Invalid id" }), { status: 400 });
  const data = await req.json().catch(() => ({} as any));
  const allowed = ["title", "description", "coverUrl", "contentUrl"] as const;
  const sets: string[] = [];
  const values: any[] = [];
  for (const key of allowed) {
    if (key in data) {
      sets.push(`${key} = ?`);
      values.push((data as any)[key]);
    }
  }
  if (!sets.length) return new Response(JSON.stringify({ error: "No fields to update" }), { status: 400 });
  const db = getDb();
  const stmt = db.prepare(`UPDATE projects SET ${sets.join(", ")} WHERE id = ?`);
  stmt.run(...values, id);
  const row = db.prepare("SELECT id, title, description, coverUrl, contentUrl, createdAt FROM projects WHERE id = ?").get(id);
  return Response.json({ project: row });
}

