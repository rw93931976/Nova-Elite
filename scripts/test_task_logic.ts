
import { ReasoningEngine } from '../src/core/agents/ReasoningEngine';

// Mock NovaCore
const mockNovaCore = {
    createTask: async (title: string, description: string, priority: string) => {
        console.log(`[MOCK] Creating task: ${title} (${priority})`);
        return { id: 'test-id', title, status: 'pending' };
    },
    listTasks: async () => {
        console.log(`[MOCK] Listing tasks`);
        return [{ id: '1', title: 'Test Task 1', status: 'pending', priority: 'high' }];
    },
    logThought: async (stage: string, content: string) => {
        console.log(`[THOUGHT] ${stage}: ${content}`);
    },
    readFile: async (path: string) => {
        console.log(`[MOCK] Reading file: ${path}`);
        return 'Mock file content';
    },
    listDirectory: async (path: string) => {
        console.log(`[MOCK] Listing directory: ${path}`);
        return ['file1.txt', 'file2.txt'];
    }
};

async function testLogic() {
    const engine = new ReasoningEngine(mockNovaCore as any);

    console.log('\n--- Test 1: Create Task ---');
    await engine.reason('Nova, remember to audit the bridge code with high priority', {});

    console.log('\n--- Test 2: List Tasks ---');
    await engine.reason('What tasks do I have pending?', {});

    console.log('\n--- Test 3: Read File (Sensory Link) ---');
    await engine.reason('Read the handoff document', {});
}

testLogic().catch(console.error);
