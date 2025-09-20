// src/lib/aws-config.ts
export const AWS_CONFIG = {
  // Prefer your env (us-east-1). Fallback kept just in case.
  region: process.env.AWS_REGION ?? "us-east-1",

  bedrock: {
    // Prefer profile (Nova) over modelId
    inferenceProfileId: process.env.BEDROCK_INFERENCE_PROFILE_ID || undefined, // e.g. "us.amazon.nova-pro-v1:0"
    inferenceProfileArn: process.env.BEDROCK_INFERENCE_PROFILE_ARN || undefined,
    modelId:
      // leave undefined if you're using Nova via profile;
      // avoid defaulting to "amazon.nova-pro-v1:0" (not on-demand)
      process.env.BEDROCK_MODEL_ID || undefined,
    visionModelId: process.env.BEDROCK_VISION_MODEL_ID || undefined,
    debug: process.env.DEBUG_BEDROCK === "1",
  },

  dataSources: {
    // Read your env key; also accept alternates for compatibility
    trends:
      (process.env.TRENDS_DATA_SOURCE ||
        process.env.DATA_SOURCES_TRENDS ||
        process.env.TOPICS_SOURCE ||
        "bedrock").toLowerCase(),

    dynamodb: {
      // Handle your typo: DYNAMODB_TRENS_TABLE
      trendsTable:
        process.env.DYNAMODB_TRENDS_TABLE ||
        process.env.DYNAMODB_TRENS_TABLE ||
        "creator-trends",
    },

    s3: {
      trendsBucket: process.env.S3_TRENDS_BUCKET || "creator-hub-trends",
    },

    external: {
      twitter: process.env.TWITTER_API_KEY,
      tiktok: process.env.TIKTOK_API_KEY,
      youtube: process.env.YOUTUBE_API_KEY,
    },
  },

  // Useful derived values you can log/use in routes
  resolved: {
    idKind: ((): "profileArn" | "profileId" | "modelId" | "none" => {
      if (process.env.BEDROCK_INFERENCE_PROFILE_ARN) return "profileArn";
      if (process.env.BEDROCK_INFERENCE_PROFILE_ID) return "profileId";
      if (process.env.BEDROCK_MODEL_ID) return "modelId";
      return "none";
    })(),
    id:
      process.env.BEDROCK_INFERENCE_PROFILE_ARN ||
      process.env.BEDROCK_INFERENCE_PROFILE_ID ||
      process.env.BEDROCK_MODEL_ID ||
      "",
  },
} as const;

export type AwsConfig = typeof AWS_CONFIG;

// Optional helper for passing straight into yo
