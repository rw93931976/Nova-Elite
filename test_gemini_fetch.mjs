const API_KEY = "AIzaSyBKdROGcbrA6UCt4QZ_uy5xOrqmYQGMJjM";
const MODEL_ID = "gemini-2.5-flash";

async function testKey() {
    console.log(`Testing Gemini API Key with model: ${MODEL_ID}...`);
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${MODEL_ID}:generateContent?key=${API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "What is the capital of France?" }] }]
            })
        });

        if (response.ok) {
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
            console.log(`SUCCESS! Gemini responded: "${text}"`);
        } else {
            const err = await response.json().catch(() => ({}));
            console.error(`FAILED! Status: ${response.status}`, JSON.stringify(err, null, 2));
        }
    } catch (e) {
        console.error("Fetch error:", e);
    }
}

testKey();


