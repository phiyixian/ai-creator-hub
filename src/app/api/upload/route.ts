import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    return new Response(JSON.stringify({ error: "No file provided" }), { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const uploadsDir = path.join(process.cwd(), "public", "uploads");
  fs.mkdirSync(uploadsDir, { recursive: true });
  const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9_.-]/g, "_")}`;
  const destPath = path.join(uploadsDir, fileName);
  fs.writeFileSync(destPath, bytes);
  const url = `/uploads/${fileName}`;
  return Response.json({ url });
}

