const WebSocket = require('ws');

const keys = [
    'AIzaSyBKdROGcbrA6UCt4QZ_uy5xOrqmYQGMJjM', // VITE
    'AIzaSyAReqI7OTLh1Xq2yVBCehMi-33Z-1rR3eU', // GEMINI env
    'AIzaSyAOjV8Qo1Szbp_flRB8Tm20YAbYbURacrg'  // GOOGLE env
];

async function testKey(key) {
    return new Promise((resolve) => {
        const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${key}`;
        const ws = new WebSocket(url);

        ws.on('open', () => {
            console.log(`[OK] Key works: ${key.substring(0, 10)}...`);
            ws.close();
            resolve(true);
        });

        ws.on('error', (err) => {
            console.log(`[ERR] Key failed: ${key.substring(0, 10)}... | Error: ${err.message}`);
            resolve(false);
        });

        ws.on('close', (code, reason) => {
            if (code !== 1000) {
                console.log(`[CLOSE] Key failed: ${key.substring(0, 10)}... | Code: ${code} | Reason: ${reason}`);
                resolve(false);
            }
        });
    });
}

(async () => {
    for (const key of keys) {
        await testKey(key);
    }
    process.exit(0);
})();
