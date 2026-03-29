
import { NovaCore } from '../NovaCore';

async function testFallback() {
    console.log('🧪 Starting API Fallback Verification...');
    const core = new NovaCore();
    await core.initialize();

    // 1. Manually trigger a "failure"
    console.log('📉 Simulating API Failure...');
    try {
        // We pass an input that would normally trigger an API call
        // But we mock the fetch to fail or just wait for the catch block
        await core.processElite('trigger_failure_test');
    } catch (e) {
        console.log('Caught expected error');
    }

    const status = core.getStatus();
    console.log('📊 Current Level:', status.level);
    console.log('📊 API Health:', status.health.apiKey);

    if (status.level < 5 && status.health.apiKey === 'offline') {
        console.log('✅ Fallback Verification: System correctly detected failure and updated state.');
    } else {
        console.log('❌ Fallback Verification: System did not update state as expected.');
    }
}

testFallback();
