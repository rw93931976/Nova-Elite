/**
 * Test script for Nova's Recursive Autonomy
 * Mocks the NovaCore and environment to verify the OODAR cycle.
 */

// Mock globals for Vite/Browser env
global.import = { meta: { env: { VITE_GEMINI_API_KEY: "mock-key" } } };
global.fetch = async (url) => {
    console.log(`[MOCK FETCH] ${url}`);
    if (url.includes('gemini')) {
        return {
            ok: true,
            json: async () => ({
                candidates: [{ content: { parts: [{ text: "Analysis: The handoff file contains v1.8 status." }] } }]
            })
        };
    }
    return { ok: false };
};

const { ReasoningEngine } = require('../src/core/agents/ReasoningEngine');

class MockNovaCore {
    constructor() {
        this.thoughts = [];
    }
    async logThought(stage, text, data) {
        this.thoughts.push({ stage, text });
        console.log(`[LOG] ${stage}: ${text}`);
    }
    async readFile(path) {
        console.log(`[SENSORY] Reading file: ${path}`);
        return "v1.8 Ultimate Status: Speech defense active.";
    }
    async listDirectory(path) {
        console.log(`[SENSORY] Listing directory: ${path}`);
        return ["MISSION_HANDOFF_NOVA_v1.8.md", "App.tsx"];
    }
}

async function runTest() {
    const core = new MockNovaCore();
    const reasoner = new ReasoningEngine(core);

    console.log("--- TEST 1: Conversational Pathing ---");
    const result = await reasoner.reason("Read the handoff file", {});

    const hasSensoryLoop = core.thoughts.some(t => t.text.includes('Loop 1: Targeting nova_core'));
    const hasSensoryInput = core.thoughts.some(t => t.stage === 'Action' && t.text.includes('Synthesizing sensory data'));

    console.log("\n--- TEST RESULTS ---");
    console.log(`Sensory Loop Triggered: ${hasSensoryLoop}`);
    console.log(`Recursive Data Acquisition: ${hasSensoryInput}`);
    console.log(`Final Response: ${result.response}`);

    if (hasSensoryLoop && hasSensoryInput) {
        console.log("\n✅ SUCCESS: Nova is now thinking recursively.");
    } else {
        console.log("\n❌ FAILURE: Nova is still using single-pass logic.");
        process.exit(1);
    }
}

runTest().catch(console.error);
