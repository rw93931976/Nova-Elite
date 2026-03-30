// Mock Vite env for Node execution
(global as any).import = { meta: { env: { VITE_SUPABASE_URL: "https://placeholder.supabase.co", VITE_SUPABASE_ANON_KEY: "placeholder" } } };
(global as any).navigator = { onLine: true };
(global as any).localStorage = { getItem: () => null, setItem: () => null };
(global as any).window = { location: { hostname: 'localhost' } };

import { NovaCore } from '../src/core/NovaCore';
import { AgentFactory } from '../src/core/agents/AgentFactory';

async function verifySwarm() {
    console.log("🔍 [Verification] Initializing NovaCore...");
    const core = new NovaCore();
    await core.initialize();

    const status = core.getStatus();
    console.log(`📊 [Status] Total Agents: ${status.agentCount}`);
    console.log(`📊 [Status] Wharton Compliance: ${status.whartonCompliance}%`);

    const strategy = core.getStatus().agentCount > 5;
    console.log(`✅ [Check] Agent Swarm Active: ${strategy}`);

    const testRole = "revenue";
    const revenueAgent = AgentFactory.spawn(testRole, core);
    if (revenueAgent && typeof revenueAgent.getStatement === 'function') {
        console.log(`✅ [Check] ${testRole} Agent is functional:`, revenueAgent.getStatement());
    } else {
        console.error(`❌ [Check] ${testRole} Agent failed functional check.`);
    }

    console.log("🚀 [Verification] Swarm Pulse Complete.");
}

verifySwarm().catch(console.error);
