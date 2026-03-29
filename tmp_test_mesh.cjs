const axios = require('axios');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://nqrtqfgbnwzsveemuyuu.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function testSovereignGateway() {
    console.log("🚀 [Mesh Test] Verifying Sovereign Gateway Connectivity...");

    try {
        const response = await axios.post(`${SUPABASE_URL}/functions/v1/sovereign-brain`, {
            input: "Are you Sovereign and and do you have humor?",
            persona: "You are Nova Elite v4.3. Respond with your Sovereign status."
        }, {
            headers: { 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });

        console.log("✨ [Response]:", response.data.response);
        console.log("✅ [Success] Mesh is humming. Gateway fallback is active.");
    } catch (err) {
        console.error("❌ [Mesh Error]:", err.response?.data || err.message);
    }
}

testSovereignGateway();
