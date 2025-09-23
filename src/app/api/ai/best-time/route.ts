import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { timezone = "UTC" } = await req.json().catch(() => ({ timezone: "UTC" }));
  const now = new Date();
  const hours = [9, 12, 18, 21];
  const times = hours.map((h, idx) => new Date(now.getFullYear(), now.getMonth(), now.getDate() + (idx % 2), h, 0, 0));
  return Response.json({ times: times.map((d) => d.toISOString()), timezone });
}

