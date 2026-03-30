const { chromium } = require('playwright');
const axios = require('axios');

async function calibrate() {
    console.log("--------------------------------------------------");
    console.log("🌟 NOVA SOVEREIGN HANDSHAKE: DIAGNOSTIC MODE 🌟");
    console.log("--------------------------------------------------");

    const supabaseUrl = process.env.SUPABASE_URL || 'https://nqrtqfgbnwzsveemuyuu.supabase.co';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    try {
        console.log("[1/3] Launching Chrome engine...");
        const browser = await chromium.launch({
            headless: false,
            channel: 'chrome',
            args: ['--disable-blink-features=AutomationControlled']
        });

        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
        });

        const page = await context.newPage();
        await page.goto('https://notebooklm.google.com/');

        console.log("[2/3] Chrome is open. Please log in.");
        console.log("      Scanning for session every 2 seconds...");

        let found = false;
        let scanCount = 0;

        while (!found) {
            scanCount++;
            const cookies = await context.cookies();
            const sidCookie = cookies.find(c => c.name.toLowerCase().includes('sid'));
            const currentUrl = page.url();

            process.stdout.write(`\r[SCAN #${scanCount}] Cookies found: ${cookies.length} | SID: ${sidCookie ? "✅ YES" : "❌ NO"} | URL: ${currentUrl.substring(0, 30)}...`);

            if (sidCookie && (currentUrl.includes('notebook') || currentUrl.includes('google.com'))) {
                found = true;
                console.log("\n\n[3/3] ✅ SESSION CAPTURED. Sealing Nova's Vault...");

                try {
                    await axios.post(`${supabaseUrl}/rest/v1/nova_secrets`, {
                        key: 'GOOGLE_SESSION_COOKIE',
                        value: JSON.stringify(cookies)
                    }, {
                        headers: {
                            'Authorization': `Bearer ${supabaseKey}`,
                            'apikey': supabaseKey,
                            'Prefer': 'resolution=merge-duplicates'
                        },
                        timeout: 10000
                    });

                    console.log("✨ SUCCESS: Nova's internal brain has calibrated her hands.");
                    await new Promise(r => setTimeout(r, 2000));
                    await browser.close();
                    process.exit(0);
                } catch (apiError) {
                    console.error("\n❌ VAULT ERROR:", apiError.response?.data || apiError.message);
                    console.log("If you see this, please tell me the error message above.");
                    await new Promise(r => setTimeout(r, 10000));
                    process.exit(1);
                }
            }
            await new Promise(r => setTimeout(r, 2000));
        }

    } catch (e) {
        console.error("\n❌ FATAL CRASH:", e.message);
        await new Promise(r => setTimeout(r, 10000));
        process.exit(1);
    }
}

calibrate();
