import { ReasoningEngine } from '../src/core/agents/ReasoningEngine.js';

// Mock Vite globals
(global as any).import = { meta: { env: { VITE_GEMINI_API_KEY: "mock-key" } } };

// Mock fetch
(global as any).fetch = async (url: string) => {
    if (url.includes('gemini')) {
        return {
            ok: true,
            json: async () => ({
                candidates: [{ content: { parts: [{ text: "I see the handoff file. Its status is v1.8." }] } }]
            })
        };
    }
    return { ok: false };
};

class MockNovaCore {
    thoughts: any[] = [];
    async logThought(stage: string, text: string) {
        this.thoughts.push({ stage, text });
        console.log(`[LOG] ${stage}: ${text}`);
    }
    async readFile(path: string) {
        console.log(`[SENSORY] Reading file: ${path}`);
        return "v1.8 Ultimate Status: Active.";
    }
    async listDirectory(path: string) {
        console.log(`[SENSORY] Listing directory: ${path}`);
        return ["handoff.md"];
    }
}

async function runTest() {
    const core = new MockNovaCore();
    const reasoner = new (ReasoningEngine as any)(core);

    console.log("--- START RECURSIVE TEST ---");
    const result = await reasoner.reason("Read the handoff file", {});

    const sensoryTriggers = core.thoughts.filter(t => t.text.includes('Synthesizing sensory data'));
    console.log(`\nLoops detected: ${core.thoughts.filter(t => t.stage === 'Orientation').length}`);
    console.log(`Sensory integration steps: ${sensoryTriggers.length}`);
    console.log(`Final Response: ${result.response}`);

    if (sensoryTriggers.length > 0) {
        console.log("\n✅ VERIFIED: Nova identified she needed files, fetched them, and THEN generated a response.");
    } else {
        console.log("\n❌ FAILED: Nova still acting like a one-pass script.");
        process.exit(1);
    }
}

runTest().catch(e => {
    console.error(e);
    process.exit(1);
});
