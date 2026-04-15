import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI("AIzaSyBKdROGcbrA6UCt4QZ_uy5xOrqmYQGMJjM");

async function run() {
    try {
        console.log("Listing models...");
        // List models manually via fetch to see all properties
        const res = await fetch("https://generativelanguage.googleapis.com/v1beta/models?key=AIzaSyBKdROGcbrA6UCt4QZ_uy5xOrqmYQGMJjM");
        const data = await res.json();

        const models = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
        console.log(`Found ${models.length} models supporting generateContent.`);

        for (const m of models) {
            const modelId = m.name.split("/")[1];
            console.log(`Testing model: ${modelId} (${m.name})...`);
            try {
                const model = genAI.getGenerativeModel({ model: modelId });
                const result = await model.generateContent("hi");
                const text = result.response.text();
                console.log(`SUCCESS: ${modelId} -> "${text.substring(0, 20)}..."`);
                process.exit(0); // Stop at first success
            } catch (e) {
                console.log(`FAILED: ${modelId} -> ${e.message}`);
            }
        }
    } catch (e) {
        console.error("CRITICAL ERROR:", e);
    }
}

run();
