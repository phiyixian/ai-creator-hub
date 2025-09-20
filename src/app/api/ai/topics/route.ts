// src/app/api/ai/topics/route.ts
import { NextRequest } from "next/server";
// ✅ use the new helper instead of invokeClaude
import { invokeClaudeJSON } from "@/lib/bedrock";

export const runtime = "nodejs";

export type TopicSuggestion = {
  title: string;
  description: string;
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: string;
  platforms: string[];
  tags: string[];
  engagement: "high" | "medium" | "low";
};

const DEBUG_API = process.env.DEBUG_BEDROCK_API === "1";
const bedrockOpts = {
  region: process.env.AWS_REGION || undefined,
  inferenceProfileId: process.env.BEDROCK_INFERENCE_PROFILE_ID || undefined, // e.g. "us.amazon.nova-pro-v1:0"
  inferenceProfileArn: process.env.BEDROCK_INFERENCE_PROFILE_ARN || undefined,
  modelId: process.env.BEDROCK_MODEL_ID || undefined, // optional for on-demand models
  debug: process.env.DEBUG_BEDROCK === "1",
};

export async function POST(req: NextRequest) {
  const t0 = Date.now();
  const { persona, query, preferences, count = 5 } = await req.json().catch(() => ({} as any));
  if (!persona) return Response.json({ error: "Persona is required" }, { status: 400 });

  if (DEBUG_API) {
    console.log("[api/topics] >>> request", {
      persona,
      query,
      count,
      bedrock: {
        region: bedrockOpts.region,
        profileId: bedrockOpts.inferenceProfileId,
        profileArn: bedrockOpts.inferenceProfileArn,
        modelId: bedrockOpts.modelId,
      },
    });
  }

  try {
    const suggestions = await generateTopicsWithBedrock(persona, query, preferences, count);

    if (DEBUG_API) {
      console.log("[api/topics] <<< success", {
        tookMs: Date.now() - t0,
        count: suggestions.length,
      });
    }

    return Response.json({
      suggestions,
      source: "bedrock",
      persona,
      query: query || "general",
    });
  } catch (err: any) {
    const payload: any = {
      tookMs: Date.now() - t0,
      name: err?.name,
      message: err?.message,
      status: err?.$metadata?.httpStatusCode,
      requestId: err?.$metadata?.requestId,
      stage: err?.stage,
      reason: err?.reason,
    };
    console.error("[api/topics] !!! bedrock_error", payload);

    // keep the soft fallback so UI won't break
    const suggestions = generateMockTopics(persona, query, preferences, count);
    return Response.json(
      {
        suggestions,
        source: "mock",
        ...(DEBUG_API ? { error: payload } : {}),
      },
      { status: 502 }
    );
  }
}

async function generateTopicsWithBedrock(
  persona: string,
  query: string,
  preferences: any,
  count: number
): Promise<TopicSuggestion[]> {
  const system =
    "You are an expert content strategist. Use the provided tool to return structured topic suggestions only. Do not return free text.";

  const user =
    `Generate ${count} creative content topic suggestions for a ${persona}.` +
    (query ? ` Focus area: ${query}.` : "") +
    (preferences?.contentTypes && Array.isArray(preferences.contentTypes) && preferences.contentTypes.length
      ? ` Content types: ${preferences.contentTypes.join(", ")}.`
      : "");

  if (DEBUG_API) {
    console.log("[api/topics] built prompt", {
      persona,
      query,
      count,
      preferences,
      userHead: user.slice(0, 200),
    });
  }

  const schema = {
    type: "object",
    properties: {
      suggestions: {
        type: "array",
        minItems: Math.min(Number(count) || 5, 10),
        maxItems: Math.min(Number(count) || 5, 10),
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            category: {
              type: "string",
              enum: ["tech", "lifestyle", "creator", "music", "products", "education", "gaming", "fitness", "food", "travel"],
            },
            difficulty: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
            estimatedTime: { type: "string" },
            platforms: { type: "array", items: { type: "string" } },
            tags: { type: "array", items: { type: "string" } },
            engagement: { type: "string", enum: ["high", "medium", "low"] },
          },
          required: ["title", "description", "category", "difficulty", "estimatedTime", "platforms", "tags", "engagement"],
        },
      },
    },
    required: ["suggestions"],
  };

  // Structured call (with tool) and fallback handled inside invokeClaudeJSON
  const out = await invokeClaudeJSON<{ suggestions: TopicSuggestion[] }>(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    schema,
    {
      region: bedrockOpts.region,
      inferenceProfileId: bedrockOpts.inferenceProfileId,
      inferenceProfileArn: bedrockOpts.inferenceProfileArn,
      modelId: bedrockOpts.modelId,
      debug: bedrockOpts.debug,
    }
  );

  if (DEBUG_API) {
    console.log("[api/topics] structured out keys:", out ? Object.keys(out) : null);
    console.log("[api/topics] suggestions len:", Array.isArray(out?.suggestions) ? out!.suggestions.length : "n/a");
    if (Array.isArray(out?.suggestions) && out!.suggestions.length) {
      console.log("[api/topics] first suggestion preview:", JSON.stringify(out!.suggestions[0]).slice(0, 240));
    }
  }

  const suggestions = Array.isArray(out?.suggestions) ? out.suggestions.slice(0, count) : [];
  if (!suggestions.length) {
    const err: any = new Error("Empty suggestions from tool/text JSON");
    err.stage = "normalize";
    err.reason = `out.suggestions type: ${typeof out?.suggestions}`;
    throw err;
  }

  return suggestions.map((s) => ({
    ...s,
    source: "bedrock",
    timestamp: new Date().toISOString(),
  }));
}



function generateMockTopics(
  persona: string,
  query: string,
  preferences: any,
  count: number
): TopicSuggestion[] {
  const baseTopics = {
    videographer: [
      {
        title: `Behind the scenes of ${persona}`,
        description: "Show your creative process and equipment setup",
        category: "creator",
        difficulty: "beginner" as const,
        estimatedTime: "15-30 min",
        platforms: ["YouTube", "TikTok", "Instagram"],
        tags: ["#BehindTheScenes", "#Videography", "#CreativeProcess"],
        engagement: "high" as const,
      },
      {
        title: `Top 5 tips for ${persona}s`,
        description: "Share your best practices and techniques",
        category: "education",
        difficulty: "intermediate" as const,
        estimatedTime: "5-10 min",
        platforms: ["YouTube", "LinkedIn", "Instagram"],
        tags: ["#Tips", "#Tutorial", "#Videography"],
        engagement: "medium" as const,
      },
      {
        title: `How I plan a ${persona} project`,
        description: "Walk through your project planning workflow",
        category: "creator",
        difficulty: "intermediate" as const,
        estimatedTime: "15-30 min",
        platforms: ["YouTube", "LinkedIn"],
        tags: ["#ProjectPlanning", "#Workflow", "#Videography"],
        engagement: "medium" as const,
      },
      {
        title: `Budget gear for ${persona}s`,
        description: "Review affordable equipment options",
        category: "products",
        difficulty: "beginner" as const,
        estimatedTime: "10-15 min",
        platforms: ["YouTube", "TikTok", "Instagram"],
        tags: ["#BudgetGear", "#Equipment", "#Videography"],
        engagement: "high" as const,
      },
      {
        title: `Mistakes to avoid as a ${persona}`,
        description: "Common pitfalls and how to avoid them",
        category: "education",
        difficulty: "intermediate" as const,
        estimatedTime: "5-10 min",
        platforms: ["YouTube", "LinkedIn"],
        tags: ["#Mistakes", "#Learning", "#Videography"],
        engagement: "high" as const,
      },
    ],
    photographer: [
      {
        title: `Golden hour photography tips`,
        description: "Master the best lighting for stunning photos",
        category: "education",
        difficulty: "beginner" as const,
        estimatedTime: "5-10 min",
        platforms: ["Instagram", "TikTok", "YouTube"],
        tags: ["#GoldenHour", "#Photography", "#Lighting"],
        engagement: "high" as const,
      },
      {
        title: `Camera settings explained`,
        description: "Break down aperture, shutter speed, and ISO",
        category: "education",
        difficulty: "intermediate" as const,
        estimatedTime: "15-30 min",
        platforms: ["YouTube", "LinkedIn"],
        tags: ["#CameraSettings", "#Photography", "#Tutorial"],
        engagement: "medium" as const,
      },
    ],
    educator: [
      {
        title: `Interactive lesson planning`,
        description: "Create engaging educational content",
        category: "education",
        difficulty: "intermediate" as const,
        estimatedTime: "15-30 min",
        platforms: ["YouTube", "LinkedIn", "TikTok"],
        tags: ["#Education", "#Teaching", "#LessonPlanning"],
        engagement: "high" as const,
      },
    ],
    streamer: [
      {
        title: `Stream setup optimization`,
        description: "Perfect your streaming setup for better quality",
        category: "gaming",
        difficulty: "intermediate" as const,
        estimatedTime: "10-15 min",
        platforms: ["Twitch", "YouTube", "TikTok"],
        tags: ["#Streaming", "#Gaming", "#Setup"],
        engagement: "high" as const,
      },
    ],
    musician: [
      {
        title: `Home studio essentials`,
        description: "Build a professional home recording setup",
        category: "music",
        difficulty: "intermediate" as const,
        estimatedTime: "15-30 min",
        platforms: ["YouTube", "TikTok", "Instagram"],
        tags: ["#HomeStudio", "#Music", "#Recording"],
        engagement: "medium" as const,
      },
    ],
  };

  const personaTopics = baseTopics[persona as keyof typeof baseTopics] || baseTopics.videographer;
  return personaTopics.slice(0, count).map((topic) => ({
    ...topic,
    source: "mock",
    timestamp: new Date().toISOString(),
  })) as TopicSuggestion[];
}
