require('dotenv').config({ path: '.env.local' });

console.log('Environment variables check:');
console.log('AWS_REGION:', process.env.AWS_REGION);
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'Set (length: ' + process.env.AWS_ACCESS_KEY_ID.length + ')' : 'Not set');
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'Set (length: ' + process.env.AWS_SECRET_ACCESS_KEY.length + ')' : 'Not set');
console.log('BEDROCK_MODEL_ID:', process.env.BEDROCK_MODEL_ID);
console.log('TRENDS_DATA_SOURCE:', process.env.TRENDS_DATA_SOURCE);
