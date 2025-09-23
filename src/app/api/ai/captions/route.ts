import { NextRequest } from "next/server";
import { invokeClaude } from "@/lib/bedrock";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { prompt } = await req.json().catch(() => ({ prompt: "" }));
  if (!prompt) return new Response(JSON.stringify({ error: "Missing prompt" }), { status: 400 });

  try {
    const system = `Create 5 short, platform-agnostic social captions. Avoid hashtags except 1-2 relevant. Include at least one with emoji, one with a question.`;
    const text = process.env.AWS_REGION
      ? await invokeClaude([
          { role: "user", content: `${system}\n\nTopic: ${prompt}\nReturn as a numbered list.` },
        ])
      : null;
    const lines = text
      ? String(text)
          .split(/\n+/)
          .map((s: string) => s.replace(/^\d+\.\s*/, "").trim())
          .filter(Boolean)
          .slice(0, 5)
      : [
          `${prompt} ✨ Behind the scenes.`,
          `From idea to post: ${prompt}.`,
          `${prompt} — what do you think?`,
          `We tried something new with ${prompt}.`,
          `Would you post this? ${prompt}`,
        ];
    return Response.json({ captions: lines });
  } catch (e) {
    return Response.json({ captions: [`${prompt} — draft caption 1`, `${prompt} — draft caption 2`] });
  }
}

