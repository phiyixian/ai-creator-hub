# AWS Integration Architecture for Inspire Page

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        INSPIRE PAGE                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Trend Search  │  │  Persona Select │  │  Topic Suggester│ │
│  │                 │  │                 │  │                 │ │
│  └─────────┬───────┘  └─────────┬───────┘  └─────────┬───────┘ │
└────────────┼────────────────────┼────────────────────┼─────────┘
             │                    │                    │
             ▼                    ▼                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER                                 │
│  ┌─────────────────┐                    ┌─────────────────┐    │
│  │ /api/ai/trends  │                    │ /api/ai/topics  │    │
│  │                 │                    │                 │    │
│  └─────────┬───────┘                    └─────────┬───────┘    │
└────────────┼──────────────────────────────────────┼─────────────┘
             │                                      │
             ▼                                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    AWS SERVICES                                │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   AWS BEDROCK   │  │    DYNAMODB     │  │       S3        │ │
│  │                 │  │                 │  │                 │ │
│  │ • Claude Models │  │ • Trends Table  │  │ • JSON Files    │ │
│  │ • AI Generation │  │ • User Prefs    │  │ • Static Data   │ │
│  │ • Topic Ideas   │  │ • Cached Data   │  │ • Media Assets  │ │
│  └─────────┬───────┘  └─────────┬───────┘  └─────────┬───────┘ │
│            │                    │                    │
│            └────────────────────┼────────────────────┘
│                                 │
│  ┌─────────────────┐            │
│  │  EXTERNAL APIs  │            │
│  │                 │            │
│  │ • Twitter API   │◄───────────┘
│  │ • TikTok API    │
│  │ • YouTube API   │
│  └─────────────────┘
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. Trend Discovery Flow
```
User Search Query → /api/ai/trends → AWS Bedrock → AI-Generated Trends → UI Display
```

### 2. Topic Suggestion Flow
```
Persona + Query → /api/ai/topics → AWS Bedrock → AI-Generated Topics → UI Display
```

### 3. Data Source Priority
```
1. AWS Bedrock (Primary) - AI-generated content
2. DynamoDB (Secondary) - Cached/stored data
3. S3 (Tertiary) - Static JSON files
4. External APIs (Optional) - Real-time social data
5. Mock Data (Fallback) - Development/testing
```

## Configuration Options

### Environment Variables
```bash
# Primary Configuration
TRENDS_DATA_SOURCE=bedrock  # bedrock, dynamodb, s3, external
AWS_REGION=ap-southeast-1
BEDROCK_MODEL_ID=amazon.nova-pro-v1:0

# Database Configuration
DYNAMODB_TRENDS_TABLE=creator-trends
S3_TRENDS_BUCKET=creator-hub-trends

# External API Keys
TWITTER_API_KEY=your_key
TIKTOK_API_KEY=your_key
YOUTUBE_API_KEY=your_key
```

## Features Implemented

### ✅ Completed
- [x] AWS Bedrock integration for AI-powered content
- [x] Configurable data source selection
- [x] Error handling and loading states
- [x] Enhanced UI with rich topic suggestions
- [x] Fallback to mock data on errors
- [x] TypeScript type definitions
- [x] API route structure for trends and topics

### 🔄 Ready for Implementation
- [ ] DynamoDB integration (code prepared)
- [ ] S3 integration (code prepared)
- [ ] External API integration (code prepared)
- [ ] Real-time data updates
- [ ] Caching layer
- [ ] Analytics and monitoring

## Benefits

1. **Scalability**: AWS services scale automatically
2. **AI-Powered**: Bedrock provides intelligent content suggestions
3. **Flexibility**: Multiple data source options
4. **Reliability**: Fallback mechanisms ensure uptime
5. **Cost-Effective**: Pay only for what you use
6. **Security**: AWS handles authentication and encryption

## Next Steps

1. Set up AWS credentials and environment variables
2. Choose your preferred data source (Bedrock recommended)
3. Test the integration with your AWS account
4. Monitor usage and optimize costs
5. Add additional data sources as needed
