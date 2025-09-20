import { NextRequest } from "next/server";
import { getDb, type Project } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const db = getDb();
  const rows = db.prepare("SELECT id, title, description, coverUrl, contentUrl, createdAt FROM projects ORDER BY createdAt DESC").all() as Project[];
  return Response.json({ projects: rows });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || !body.title) {
    return new Response(JSON.stringify({ error: "Missing title" }), { status: 400 });
  }
  const { title, description = null, coverUrl = null, contentUrl = null } = body as Partial<Project> & { title: string };
  const db = getDb();
  const createdAt = Date.now();
  const info = db
    .prepare("INSERT INTO projects (title, description, coverUrl, contentUrl, createdAt) VALUES (?, ?, ?, ?, ?)")
    .run(title, description, coverUrl, contentUrl, createdAt);
  const project: Project = { id: Number(info.lastInsertRowid), title, description, coverUrl, contentUrl, createdAt };
  return Response.json({ project }, { status: 201 });
}

