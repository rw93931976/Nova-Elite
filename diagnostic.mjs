async function run() {
    console.log('🔍 NOVA SYSTEM DIAGNOSTIC (Node-Side)');
    const bridgeUrl = 'http://127.0.0.1:3505';
    const proxyUrl = 'http://127.0.0.1:5173/bridge-vps';

    console.log(`📡 Pinging Direct Bridge: ${bridgeUrl}/health`);
    try {
        const res = await fetch(`${bridgeUrl}/health`);
        const json = await res.json();
        console.log('✅ Bridge Response:', JSON.stringify(json));
    } catch (e) {
        console.error('❌ Direct Bridge Connection FAILED:', e.message);
    }

    console.log(`📡 Pinging Proxy: ${proxyUrl}/health`);
    try {
        const res = await fetch(`${proxyUrl}/health`);
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const json = await res.json();
        console.log('✅ Proxy Response:', JSON.stringify(json));
    } catch (e) {
        console.error('❌ Proxy Connection FAILED:', e.message);
    }
}
run();
