const keys = [
    'AIzaSyAwe713jhrDaaDlZ5ZipIV1AbptT-O1Qnk' // NEW Active Key
];

async function testKey(key) {
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        if (res.ok) {
            console.log(`[OK] Key works: ${key.substring(0, 10)}...`);
        } else {
            console.log(`[ERR] Key failed: ${key.substring(0, 10)}... | Status: ${res.status}`);
        }
    } catch (e) {
        console.log(`[ERR network] ${key.substring(0, 10)}... | ${e.message}`);
    }
}

(async () => {
    for (const key of keys) {
        await testKey(key);
    }
    process.exit(0);
})();
