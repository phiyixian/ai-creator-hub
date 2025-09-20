#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envContent = `# AWS Configuration
AWS_REGION=ap-southeast-5

AWS_ACCESS_KEY_ID=AKIATK7MULFXC4L4R7R5
AWS_SECRET_ACCESS_KEY=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

# Bedrock Configuration
BEDROCK_MODEL_ID=amazon.nova-pro-v1:0

# Data Sources Configuration
TRENDS_DATA_SOURCE=bedrock
DYNAMODB_TRENDS_TABLE=creator-trends
S3_TRENDS_BUCKET=creator-hub-trends

# Database Configuration (if using local database)
DATABASE_URL=file:.data/app.db
`;

const envPath = path.join(__dirname, '.env.local');

try {
  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env.local already exists!');
    console.log('📝 Please check ENV_SETUP_INSTRUCTIONS.md for manual setup');
  } else {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env.local file created successfully!');
    console.log('📝 Next steps:');
    console.log('   1. Replace placeholder values with your actual AWS credentials');
    console.log('   2. Restart your development server: npm run dev');
    console.log('   3. Test the Inspire page at http://localhost:3000/inspire');
  }
} catch (error) {
  console.error('❌ Error creating .env.local:', error.message);
  console.log('📝 Please create the file manually following ENV_SETUP_INSTRUCTIONS.md');
}
