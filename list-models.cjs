const https = require('https');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });

const googleKey = process.env.VITE_GOOGLE_AI_KEY || process.env.VITE_GEMINI_API_KEY;
if (!googleKey) {
    console.error('❌ Missing Google API Key');
    process.exit(1);
}

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${googleKey}`;

https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
        const json = JSON.parse(data);
        if (json.models) {
            console.log('✅ Available Models:');
            json.models.forEach(m => {
                if (m.supportedGenerationMethods.includes('generateContent') || m.supportedGenerationMethods.includes('bidiGenerateContent')) {
                    console.log(`- ${m.name}`);
                }
            });
        } else {
            console.log('❌ No models found or error:', json);
        }
    });
}).on('error', (err) => {
    console.error('❌ Request error:', err.message);
});
