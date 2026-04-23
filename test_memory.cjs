const memory = require('./MemoryEngine.cjs');

async function runTest() {
    console.log("💿 Initializing Semantic Memory Test...");

    // Inject mock historical conversation
    console.log("📥 Injecting historical facts...");
    await memory.addMemory("architect", "We decided to target high-end HVAC businesses making between 10m and 50m in revenue.");
    await memory.addMemory("architect", "The Disney Institute model proves that front-desk secretaries are the critical bottleneck for lead conversion.");
    await memory.addMemory("nova", "I've locked this mandate. I will structure my Receptionist agents to act as elite gatekeepers.");

    console.log("✅ Wait a second (Ensure save completed)");
    await new Promise(r => setTimeout(r, 1000));

    console.log("\n🔍 Running Semantic Queries:");

    const query1 = "Who do we sell to based on our past strategy?";
    console.log(`\n🗣️ Query: "${query1}"`);
    const results1 = await memory.searchMemory(query1);
    results1.forEach((r, i) => console.log(`   [Hit ${i + 1}] (Score: ${r.score.toFixed(3)}) -> ${r.text}`));

    const query2 = "What did we learn from that famous theme park regarding secretaries?";
    console.log(`\n🗣️ Query: "${query2}"`);
    const results2 = await memory.searchMemory(query2);
    results2.forEach((r, i) => console.log(`   [Hit ${i + 1}] (Score: ${r.score.toFixed(3)}) -> ${r.text}`));

    console.log("\n🧪 Memory Engine Validation Complete.");
}

runTest();
