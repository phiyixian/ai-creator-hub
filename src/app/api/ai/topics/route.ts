import { NextRequest } from "next/server";
import { invokeClaude } from "@/lib/bedrock";
import { AWS_CONFIG } from "@/lib/aws-config";

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

export async function POST(req: NextRequest) {
  const { persona, query, preferences, count = 5 } = await req.json().catch(() => ({}));

  if (!persona) {
    return Response.json({ error: "Persona is required" }, { status: 400 });
  }

  try {
    let suggestions: TopicSuggestion[] = [];

    if (AWS_CONFIG.dataSources.trends === "bedrock") {
      suggestions = await generateTopicsWithBedrock(persona, query, preferences, count);
    } else {
      suggestions = generateMockTopics(persona, query, preferences, count);
    }

    return Response.json({ 
      suggestions, 
      source: AWS_CONFIG.dataSources.trends,
      persona,
      query: query || "general"
    });
  } catch (error) {
    console.error("Error generating topics:", error);
    // Fallback to mock data
    const suggestions = generateMockTopics(persona, query, preferences, count);
    return Response.json({ 
      suggestions, 
      source: "mock", 
      error: "Failed to generate AI topics" 
    });
  }
}

async function generateTopicsWithBedrock(
  persona: string, 
  query: string, 
  preferences: any, 
  count: number
): Promise<TopicSuggestion[]> {
  const prompt = `You are an expert content strategist. Generate ${count} creative content topic suggestions for a ${persona}.
    
    ${query ? `Focus area: ${query}` : ""}
    ${preferences?.contentTypes ? `Content types: ${preferences.contentTypes.join(", ")}` : ""}
    
    For each topic, provide:
    - title: Engaging, specific title
    - description: 1-2 sentence description
    - category: tech, lifestyle, creator, music, products, education, gaming, fitness, food, travel
    - difficulty: beginner, intermediate, advanced
    - estimatedTime: "5-10 min", "15-30 min", "1-2 hours", "half day", "full day"
    - platforms: array of platforms like ["YouTube", "TikTok", "Instagram", "LinkedIn"]
    - tags: array of 3-5 relevant hashtags
    - engagement: high, medium, low (based on expected engagement)
    
    Return as JSON array. Make topics specific, actionable, and tailored to ${persona} audience.`;

  const response = await invokeClaude([
    { role: "user", content: prompt }
  ]);

  try {
    const suggestions = JSON.parse(response);
    return suggestions.map((suggestion: any) => ({
      ...suggestion,
      source: "bedrock",
      timestamp: new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Error parsing Bedrock response:", error);
    return generateMockTopics(persona, query, preferences, count);
  }
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
  
  return personaTopics.slice(0, count).map(topic => ({
    ...topic,
    source: "mock",
    timestamp: new Date().toISOString(),
  }));
}
