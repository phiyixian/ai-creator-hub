import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

export type BedrockOptions = {
  region?: string;
  modelId?: string;
};

export function createBedrockClient(options: BedrockOptions = {}) {
  const region = options.region || process.env.AWS_REGION || "ap-southeast-1";
  const client = new BedrockRuntimeClient({ region });
  return client;
}

export async function invokeClaude(messages: Array<{ role: string; content: string }>, options: BedrockOptions = {}) {
  const client = createBedrockClient(options);
  const modelId = options.modelId || process.env.BEDROCK_MODEL_ID || "amazon.nova-pro-v1:0";

  const converseMessages = (messages || []).map((m) => ({
    role: m.role === "assistant" ? "assistant" : "user",
    content: [{ text: String(m.content ?? "") }],
  }));

  const res = await client.send(new ConverseCommand({
    modelId,
    messages: converseMessages,
    inferenceConfig: {
      maxTokens: 800,
      temperature: 0.3,
      topP: 0.9,
    },
  }));

  const parts = res?.output?.message?.content || [];
  const combined = parts
    .map((p: any) => (typeof p?.text === "string" ? p.text : ""))
    .filter(Boolean)
    .join("\n");
  return String(combined || "");
}

export async function analyzeMediaFromUrl(mediaUrl: string, options: BedrockOptions = {}) {
  const client = createBedrockClient(options);
  const modelId = options.modelId || process.env.BEDROCK_VISION_MODEL_ID || "amazon.nova-multimodal-v1:0";

  // Fetch media bytes
  const res = await fetch(mediaUrl);
  if (!res.ok) throw new Error("Failed to fetch media");
  const contentType = res.headers.get("content-type") || "";
  const arrayBuffer = await res.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);

  // Determine image format for Bedrock message
  // Only image analysis is supported here. If video, we provide a generic fallback.
  const lowerType = contentType.toLowerCase();
  const isImage = /(image\/jpeg|image\/jpg|image\/png|image\/webp)/.test(lowerType);
  if (!isImage) {
    // Fallback generic guidance for videos for now
    const prompt = `You are a content coach. Provide concise, actionable feedback for a short-form social video focusing on: hook in first 3 seconds, framing, lighting, pacing, text overlays, clarity without sound, platform fit (TikTok/IG Reels/YouTube Shorts), and a suggested on-screen CTA. Use bullets and keep it under 12 lines.`;
    const text = await invokeClaude([{ role: "user", content: prompt }], options);
    return text;
  }

  const format = lowerType.includes("png") ? "png" : lowerType.includes("webp") ? "webp" : "jpeg";

  const system = "You are a senior creative director. Analyze the image for social content quality.";
  const userText =
    "Give actionable feedback in bullets: Overall score (0-100), Composition & framing, Lighting & color, Subject clarity, Story/Hook potential, Platform fit (IG/TikTok/YouTube), 3 specific improvements, and a punchy CTA. Keep it concise.";

  const command = new ConverseCommand({
    modelId,
    messages: [
      { role: "user", content: [{ text: system }] },
      {
        role: "user",
        content: [
          { text: userText },
          {
            image: {
              format,
              source: { bytes },
            } as any,
          },
        ],
      },
    ],
    inferenceConfig: {
      maxTokens: 700,
      temperature: 0.3,
      topP: 0.9,
    },
  });

  try {
    const out = await client.send(command);
    const parts = out?.output?.message?.content || [];
    const combined = parts
      .map((p: any) => (typeof p?.text === "string" ? p.text : ""))
      .filter(Boolean)
      .join("\n");
    return String(combined || "");
  } catch (e: any) {
    // Fallback to text-only guidance if the model or account doesn't support vision
    const prompt = `You are a content coach. Provide concise, actionable visual feedback for a social post image focusing on composition, lighting, subject clarity, platform fit, and 3 specific improvements. Use bullets and keep under 12 lines.`;
    const text = await invokeClaude([{ role: "user", content: prompt }], options);
    return text;
  }
}

