const axios = require('axios');
require('dotenv').config();

/**
 * SOVEREIGN PROXY (v1.0)
 * Purpose: A universal LLM bridge for Ray. 
 * Prevents "Brick Walls" by automatically falling back through providers.
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://nqrtqfgbnwzsveemuyuu.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function askSovereign(prompt) {
    console.log("🌀 [Sovereign Proxy] Routing request through Gateway...");

    try {
        const response = await axios.post(`${SUPABASE_URL}/functions/v1/sovereign-brain`, {
            input: prompt,
            persona: "You are the Sovereign Proxy. Provide direct, high-quality answers using your available fallbacks. Ensure Ray never hits a brick wall."
        }, {
            headers: { 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });

        console.log("\n✨ [Response]:\n");
        console.log(response.data.response);
    } catch (err) {
        console.error("❌ [Proxy Error]:", err.response?.data || err.message);
    }
}

const userPrompt = process.argv.slice(2).join(' ');
if (!userPrompt) {
    console.log("Usage: node SovereignProxy.cjs 'Your question here'");
} else {
    askSovereign(userPrompt);
}
