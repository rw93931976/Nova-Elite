/**
 * Windsurf Integration - Agent Communication System
 * Initialize and test 3-way agent communication
 */

import { WindsurfComms } from './WindsurfComms';
import { NovaComms } from './NovaComms';
import { AgentComms } from './AgentComms';

export class WindsurfIntegration {
  private static instance: WindsurfIntegration;
  private windsurfComms: WindsurfComms;
  private agentComms: AgentComms;
  private isInitialized: boolean = false;

  private constructor() {
    this.windsurfComms = WindsurfComms.getInstance();
    this.agentComms = AgentComms.getInstance();
  }

  static getInstance(): WindsurfIntegration {
    if (!WindsurfIntegration.instance) {
      WindsurfIntegration.instance = new WindsurfIntegration();
    }
    return WindsurfIntegration.instance;
  }

  async initialize(): Promise<boolean> {
    try {
      console.log('[WindsurfIntegration] Initializing 3-way agent communication...');

      // Test basic connectivity
      const testMessage = await this.windsurfComms.broadcast(
        'Windsurf communication system initialized',
        'system_init',
        'medium'
      );

      if (!testMessage) {
        console.error('[WindsurfIntegration] Failed to send test message');
        return false;
      }

      // Get agent statuses
      const statuses = await this.agentComms.getAgentStatus();
      console.log('[WindsurfIntegration] Agent statuses:', statuses);

      this.isInitialized = true;
      console.log('[WindsurfIntegration] ✅ Communication system initialized successfully');
      
      return true;
    } catch (e) {
      console.error('[WindsurfIntegration] Initialization failed:', e);
      return false;
    }
  }

  async testAntiGravityCommunication(): Promise<boolean> {
    if (!this.isInitialized) {
      console.error('[WindsurfIntegration] System not initialized');
      return false;
    }

    try {
      console.log('[WindsurfIntegration] Testing Anti-Gravity communication...');
      
      const sent = await this.windsurfComms.sendToAntiGravity(
        'Test message from Windsurf',
        'communication_test',
        'medium'
      );

      if (sent) {
        console.log('[WindsurfIntegration] ✅ Anti-Gravity communication test passed');
        return true;
      } else {
        console.log('[WindsurfIntegration] ❌ Anti-Gravity communication test failed');
        return false;
      }
    } catch (e) {
      console.error('[WindsurfIntegration] Anti-Gravity test error:', e);
      return false;
    }
  }

  async testNovaCommunication(): Promise<boolean> {
    if (!this.isInitialized) {
      console.error('[WindsurfIntegration] System not initialized');
      return false;
    }

    try {
      console.log('[WindsurfIntegration] Testing Nova communication...');
      
      const sent = await this.windsurfComms.sendToNova(
        'Test message from Windsurf',
        'communication_test',
        'medium'
      );

      if (sent) {
        console.log('[WindsurfIntegration] ✅ Nova communication test passed');
        return true;
      } else {
        console.log('[WindsurfIntegration] ❌ Nova communication test failed');
        return false;
      }
    } catch (e) {
      console.error('[WindsurfIntegration] Nova test error:', e);
      return false;
    }
  }

  async testBroadcastCommunication(): Promise<boolean> {
    if (!this.isInitialized) {
      console.error('[WindsurfIntegration] System not initialized');
      return false;
    }

    try {
      console.log('[WindsurfIntegration] Testing broadcast communication...');
      
      const sent = await this.windsurfComms.broadcast(
        'Broadcast test from Windsurf to all agents',
        'broadcast_test',
        'medium'
      );

      if (sent) {
        console.log('[WindsurfIntegration] ✅ Broadcast communication test passed');
        return true;
      } else {
        console.log('[WindsurfIntegration] ❌ Broadcast communication test failed');
        return false;
      }
    } catch (e) {
      console.error('[WindsurfIntegration] Broadcast test error:', e);
      return false;
    }
  }

  async runFullCommunicationTest(): Promise<Record<string, boolean>> {
    console.log('[WindsurfIntegration] 🧪 Running full communication test suite...');
    
    const results = {
      initialization: await this.initialize(),
      antiGravity: await this.testAntiGravityCommunication(),
      nova: await this.testNovaCommunication(),
      broadcast: await this.testBroadcastCommunication()
    };

    const allPassed = Object.values(results).every(result => result);
    
    if (allPassed) {
      console.log('[WindsurfIntegration] 🎉 ALL TESTS PASSED - 3-way communication system ready!');
    } else {
      console.log('[WindsurfIntegration] ⚠️ Some tests failed - check results:', results);
    }

    return results;
  }

  async reportBridgeStatusToAllAgents(isOnline: boolean, details?: string): Promise<boolean> {
    return await this.windsurfComms.reportBridgeStatus(isOnline, details);
  }

  async reportCodeChangesToAntiGravity(files: string[], description: string): Promise<boolean> {
    return await this.windsurfComms.reportCodeChanges(files, description);
  }

  async requestCoordination(task: string, details?: string): Promise<boolean> {
    return await this.windsurfComms.requestCoordination(task, details);
  }

  async emergencyAlert(alert: string, details?: string): Promise<boolean> {
    return await this.windsurfComms.emergencyAlert(alert, details);
  }

  async getAgentStatuses(): Promise<Record<string, any>> {
    return await this.agentComms.getAgentStatus();
  }

  async getMessagesFromAntiGravity(): Promise<any[]> {
    return await this.windsurfComms.getMessagesFromAntiGravity();
  }

  async getMessagesFromNova(): Promise<any[]> {
    return await this.windsurfComms.getMessagesFromNova();
  }

  async cleanup(): Promise<void> {
    await this.windsurfComms.cleanup();
    this.isInitialized = false;
  }
}
