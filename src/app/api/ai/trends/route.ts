import { NextRequest } from "next/server";
import { invokeClaude } from "@/lib/bedrock";
import { AWS_CONFIG } from "@/lib/aws-config";

export const runtime = "nodejs";

export type TrendData = {
  tag: string;
  growth: number;
  category: string;
  description?: string;
  imageUrl?: string;
  source?: string;
  timestamp?: string;
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const limit = parseInt(searchParams.get("limit") || "10");

  console.log("Trends API called with:", { query, category, limit });
  console.log("AWS_CONFIG:", AWS_CONFIG);

  try {
    let trends: TrendData[] = [];

    switch (AWS_CONFIG.dataSources.trends) {
      case "bedrock":
        console.log("Using Bedrock data source");
        trends = await getTrendsFromBedrock(query, category, limit);
        break;
      case "dynamodb":
        console.log("Using DynamoDB data source");
        trends = await getTrendsFromDynamoDB(query, category, limit);
        break;
      case "s3":
        console.log("Using S3 data source");
        trends = await getTrendsFromS3(query, category, limit);
        break;
      case "external":
        console.log("Using external APIs data source");
        trends = await getTrendsFromExternalAPIs(query, category, limit);
        break;
      default:
        console.log("Using mock data source");
        trends = getMockTrends(query, category, limit);
    }

    console.log("Successfully fetched trends:", trends.length);
    return Response.json({ trends, source: AWS_CONFIG.dataSources.trends });
  } catch (error) {
    console.error("Error fetching trends:", error);
    console.error("Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    // Fallback to mock data on error
    const trends = getMockTrends(query, category, limit);
    return Response.json({ trends, source: "mock", error: "Failed to fetch real data" });
  }
}

async function getTrendsFromBedrock(query: string, category: string, limit: number): Promise<TrendData[]> {
  console.log("getTrendsFromBedrock called with:", { query, category, limit });
  
  const prompt = `Generate ${limit} trending hashtags for content creators. 
    ${query ? `Focus on topics related to: ${query}` : ""}
    ${category ? `Category: ${category}` : ""}
    
    Return as JSON array with format:
    [{"tag": "#hashtag", "growth": 85, "category": "tech", "description": "Brief description"}]
    
    Include diverse categories: tech, lifestyle, creator, music, products, education, gaming, fitness, food, travel.`;

  try {
    console.log("Calling invokeClaude with prompt:", prompt.substring(0, 100) + "...");
    const response = await invokeClaude([
      { role: "user", content: prompt }
    ]);
    console.log("Bedrock response received:", response.substring(0, 200) + "...");

    const trends = JSON.parse(response);
    console.log("Parsed trends:", trends);
    
    return trends.map((trend: any) => ({
      ...trend,
      imageUrl: `https://source.unsplash.com/featured/320x180?${trend.category}`,
      source: "bedrock",
      timestamp: new Date().toISOString(),
    }));
  } catch (error) {
    console.error("Error in getTrendsFromBedrock:", error);
    console.error("Error details:", {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return getMockTrends(query, category, limit);
  }
}

async function getTrendsFromDynamoDB(query: string, category: string, limit: number): Promise<TrendData[]> {
  // TODO: Implement DynamoDB integration
  // This would require @aws-sdk/client-dynamodb
  throw new Error("DynamoDB integration not implemented yet");
}

async function getTrendsFromS3(query: string, category: string, limit: number): Promise<TrendData[]> {
  // TODO: Implement S3 integration
  // This would require @aws-sdk/client-s3
  throw new Error("S3 integration not implemented yet");
}

async function getTrendsFromExternalAPIs(query: string, category: string, limit: number): Promise<TrendData[]> {
  // TODO: Implement external API integration
  // This would fetch from Twitter, TikTok, YouTube APIs
  throw new Error("External API integration not implemented yet");
}

function getMockTrends(query: string, category: string, limit: number): TrendData[] {
  const mockTrends = [
    { tag: "#AIshorts", growth: 128, category: "tech", description: "AI-generated short content" },
    { tag: "#StudioVlog", growth: 74, category: "creator", description: "Behind the scenes content" },
    { tag: "#MorningRoutine", growth: 45, category: "lifestyle", description: "Daily routine content" },
    { tag: "#Unboxing", growth: 32, category: "products", description: "Product unboxing videos" },
    { tag: "#TinyDesk", growth: 58, category: "music", description: "Intimate music performances" },
    { tag: "#TechReview", growth: 67, category: "tech", description: "Technology reviews" },
    { tag: "#FitnessJourney", growth: 89, category: "fitness", description: "Fitness transformation content" },
    { tag: "#FoodHack", growth: 43, category: "food", description: "Quick cooking tips" },
    { tag: "#TravelTips", growth: 56, category: "travel", description: "Travel advice and guides" },
    { tag: "#GamingSetup", growth: 91, category: "gaming", description: "Gaming room setups" },
  ];

  let filtered = mockTrends;

  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(t => 
      t.tag.toLowerCase().includes(q) || 
      t.description?.toLowerCase().includes(q)
    );
  }

  if (category) {
    filtered = filtered.filter(t => t.category === category);
  }

  return filtered.slice(0, limit).map(trend => ({
    ...trend,
    imageUrl: `https://source.unsplash.com/featured/320x180?${trend.category}`,
    source: "mock",
    timestamp: new Date().toISOString(),
  }));
}
