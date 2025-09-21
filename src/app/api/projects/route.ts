// src/app/api/projects/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { QueryCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDoc } from "@/lib/aws/dynamo";
import { getSessionByToken } from "@/lib/db";
import crypto from "node:crypto";

export const runtime = "nodejs";

// You can set this in .env.local
const PROJECTS_TABLE = process.env.PROJECTS_TABLE || "creator-projects";

// Project shape we return to the UI (id is the projectId)
export type Project = {
  id: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  contentUrl?: string | null;
  createdAt: number;     // epoch ms
  updatedAt: number;     // epoch ms
};

// Helper: resolve current userId from the session cookie
async function requireUserId(): Promise<string | null> {
  const store = await cookies();                      // Next 15: must await
  const token = store.get("session")?.value;
  if (!token) return null;

  const session = await getSessionByToken(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) return null;

  // Using OIDC `sub` (string) as our userId (per your new db.ts)
  return String(session.userId);
}

export async function GET() {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!PROJECTS_TABLE) {
    return NextResponse.json({ error: "PROJECTS_TABLE not configured" }, { status: 500 });
  }

  // Query all projects for this user; sort client-side by createdAt desc
  const res = await ddbDoc.send(
    new QueryCommand({
      TableName: PROJECTS_TABLE,
      KeyConditionExpression: "userId = :u",
      ExpressionAttributeValues: { ":u": userId },
    })
  );

  const items = (res.Items ?? []) as Array<{
    userId: string;
    projectId: string;
    title: string;
    description?: string | null;
    coverUrl?: string | null;
    contentUrl?: string | null;
    createdAt?: number;
    updatedAt?: number;
  }>;

  const projects: Project[] = items
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
    .map((it) => ({
      id: it.projectId,
      title: it.title,
      description: it.description ?? null,
      coverUrl: it.coverUrl ?? null,
      contentUrl: it.contentUrl ?? null,
      createdAt: it.createdAt ?? 0,
      updatedAt: it.updatedAt ?? it.createdAt ?? 0,
    }));

  return NextResponse.json({ projects }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  const userId = await requireUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!PROJECTS_TABLE) {
    return NextResponse.json({ error: "PROJECTS_TABLE not configured" }, { status: 500 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.title) {
    return NextResponse.json({ error: "Missing title" }, { status: 400 });
  }

  const {
    title,
    description = null,
    coverUrl = null,
    contentUrl = null,
  }: {
    title: string;
    description?: string | null;
    coverUrl?: string | null;
    contentUrl?: string | null;
  } = body;

  const now = Date.now();
  const projectId = crypto.randomUUID();

  // Store with PK = userId, SK = projectId (common pattern)
  await ddbDoc.send(
    new PutCommand({
      TableName: PROJECTS_TABLE,
      Item: {
        userId,
        projectId,
        title,
        description,
        coverUrl,
        contentUrl,
        createdAt: now,
        updatedAt: now,
      },
    })
  );

  const project: Project = {
    id: projectId,
    title,
    description,
    coverUrl,
    contentUrl,
    createdAt: now,
    updatedAt: now,
  };

  return NextResponse.json({ project }, { status: 201, headers: { "Cache-Control": "no-store" } });
}
