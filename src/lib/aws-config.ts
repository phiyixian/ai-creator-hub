export const AWS_CONFIG = {
  region: process.env.AWS_REGION || "ap-southeast-1",
  bedrock: {
    modelId: process.env.BEDROCK_MODEL_ID || "amazon.nova-pro-v1:0",
  },
  dataSources: {
    trends: process.env.TRENDS_DATA_SOURCE || "bedrock", // bedrock, dynamodb, s3, external
    dynamodb: {
      trendsTable: process.env.DYNAMODB_TRENDS_TABLE || "creator-trends",
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
} as const;
