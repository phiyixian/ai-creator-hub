// src/app/api/ai/captions/route.ts (or wherever this handler lives)
import { NextRequest } from "next/server";
import { invokeClaude } from "@/lib/bedrock";

export const runtime = "nodejs";

const PREVIEW = (s: string, n = 160) => (s ?? "").slice(0, n);
const errInfo = (e: any) => ({
  name: e?.name,
  message: e?.message,
  status: e?.$metadata?.httpStatusCode,
  requestId: e?.$metadata?.requestId,
});

export async function POST(req: NextRequest) {
  const debug = process.env.DEBUG_BEDROCK_API === "1" || process.env.DEBUG_BEDROCK === "1";
  const t0 = Date.now();

  const { prompt } = await req.json().catch(() => ({ prompt: "" }));
  if (!prompt) {
    if (debug) console.warn("[api/captions] 400 Missing prompt");
    return new Response(JSON.stringify({ error: "Missing prompt" }), { status: 400 });
  }

  // Capture env wiring (non-secret)
  const region = process.env.AWS_REGION || "";
  const profileId = process.env.BEDROCK_INFERENCE_PROFILE_ID || "";
  const profileArn = process.env.BEDROCK_INFERENCE_PROFILE_ARN || "";
  const modelId = process.env.BEDROCK_MODEL_ID || "";

  if (debug) {
    console.log("[api/captions] >>> request", {
      promptPreview: PREVIEW(prompt),
      region,
      hasProfileId: Boolean(profileId),
      hasProfileArn: Boolean(profileArn),
      hasModelId: Boolean(modelId),
    });
  }

  try {
    const system =
      "Create 5 short, platform-agnostic social captions. Avoid hashtags except 1-2 relevant. Include at least one with emoji, one with a question.";

    // Build the single user message
    const userMsg = {
      role: "user",
      content: `${system}\n\nTopic: ${prompt}\nReturn as a numbered list.`,
    };

    // If AWS_REGION isn't set, your original code skipped Bedrock.
    if (!process.env.AWS_REGION && debug) {
      console.warn("[api/captions] AWS_REGION not set — Bedrock call will be skipped and fallback used");
    }

    const text = process.env.AWS_REGION
      ? await invokeClaude([userMsg], {
          // pass-through config so logs show exactly what we used
          region: region || undefined,
          inferenceProfileId: profileId || undefined,
          inferenceProfileArn: profileArn || undefined,
          modelId: modelId || undefined,
          debug, // propagate debug into the library
        })
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

    if (debug) {
      console.log("[api/captions] <<< response", {
        tookMs: Date.now() - t0,
        usedBedrock: Boolean(text),
        textLen: text ? String(text).length : 0,
        captionsCount: lines.length,
        captionsPreview: lines.map((c) => PREVIEW(c, 80)),
      });
    }

    return Response.json({ captions: lines });
  } catch (e: any) {
    if (debug) console.error("[api/captions] !!! error", { tookMs: Date.now() - t0, ...errInfo(e) });

    // Keep your original “soft fallback” behavior:
    return Response.json({
      captions: [`${prompt} — draft caption 1`, `${prompt} — draft caption 2`],
      // Add a hint when debugging:
      ...(debug ? { error: errInfo(e) } : {}),
    });
  }
}
