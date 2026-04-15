/**
 * Nova Communication Interface
 * Handles Nova ↔ Windsurf and Nova ↔ Anti-Gravity messaging
 */

import { AgentComms, type AgentMessage } from './AgentComms';

export class NovaComms {
  private static instance: NovaComms;
  private agentComms: AgentComms;
  private agentId: string = 'nova';

  private constructor() {
    this.agentComms = AgentComms.getInstance();
    this.initializeSubscriptions();
  }

  static getInstance(): NovaComms {
    if (!NovaComms.instance) {
      NovaComms.instance = new NovaComms();
    }
    return NovaComms.instance;
  }

  private initializeSubscriptions(): void {
    this.agentComms.subscribe(this.agentId, (msg: AgentMessage) => {
      this.handleIncomingMessage(msg);
    });
  }

  private async handleIncomingMessage(msg: AgentMessage): Promise<void> {
    console.log(`[NovaComms] Received from ${msg.sender}: ${msg.message}`);
    
    // Mark message as read
    if (msg.id) {
      await this.agentComms.markAsRead(msg.id);
    }

    // Handle different message types
    switch (msg.command) {
      case 'status_request':
        await this.handleStatusRequest(msg);
        break;
      case 'system_update':
        await this.handleSystemUpdate(msg);
        break;
      case 'user_query':
        await this.handleUserQuery(msg);
        break;
      case 'emergency':
        await this.handleEmergency(msg);
        break;
      default:
        await this.handleGeneralMessage(msg);
    }
  }

  private async handleStatusRequest(msg: AgentMessage): Promise<void> {
    const status = await this.getNovaStatus();
    await this.sendToAgent(msg.sender, `Nova Status: ${JSON.stringify(status)}`, 'status_response');
  }

  private async handleSystemUpdate(msg: AgentMessage): Promise<void> {
    console.log(`[NovaComms] System update: ${msg.message}`);
    // System update handling logic here
    await this.sendToAgent(msg.sender, `Nova ACK: System update received`, 'system_update_ack');
  }

  private async handleUserQuery(msg: AgentMessage): Promise<void> {
    console.log(`[NovaComms] User query forwarded: ${msg.message}`);
    // User query handling logic here
    await this.sendToAgent(msg.sender, `Nova ACK: User query received`, 'user_query_ack');
  }

  private async handleEmergency(msg: AgentMessage): Promise<void> {
    console.error(`[NovaComms] EMERGENCY from ${msg.sender}: ${msg.message}`);
    // Emergency handling logic here
    await this.broadcast(`Nova ACK: Emergency received - "${msg.message}"`, 'emergency_ack');
  }

  private async handleGeneralMessage(msg: AgentMessage): Promise<void> {
    console.log(`[NovaComms] General message: ${msg.message}`);
    // General message handling logic here
  }

  async sendToAntiGravity(message: string, command?: string, priority: AgentMessage['priority'] = 'medium'): Promise<boolean> {
    return await this.agentComms.sendMessage('nova', 'antigravity', message, command, priority);
  }

  async sendToWindsurf(message: string, command?: string, priority: AgentMessage['priority'] = 'medium'): Promise<boolean> {
    return await this.agentComms.sendMessage('nova', 'windsurf', message, command, priority);
  }

  async sendToAgent(agent: string, message: string, command?: string, priority: AgentMessage['priority'] = 'medium'): Promise<boolean> {
    return await this.agentComms.sendMessage('nova', agent as any, message, command, priority);
  }

  async broadcast(message: string, command?: string, priority: AgentMessage['priority'] = 'medium'): Promise<boolean> {
    return await this.agentComms.broadcast('nova', message, command, priority);
  }

  async reportReasoningStatus(status: 'success' | 'failed' | 'processing', details?: string): Promise<boolean> {
    const message = `Reasoning Status: ${status}${details ? ` - ${details}` : ''}`;
    return await this.broadcast(message, 'reasoning_status', status === 'failed' ? 'high' : 'medium');
  }

  async reportBridgeIssue(issue: string, severity: 'low' | 'medium' | 'high' | 'critical'): Promise<boolean> {
    const message = `Bridge Issue: ${issue}`;
    return await this.broadcast(message, 'bridge_issue', severity);
  }

  async reportUserInteraction(interaction: string, success: boolean): Promise<boolean> {
    const message = `User Interaction: ${interaction} - ${success ? 'SUCCESS' : 'FAILED'}`;
    return await this.sendToWindsurf(message, 'user_interaction', success ? 'low' : 'medium');
  }

  async requestAssistance(request: string, details?: string): Promise<boolean> {
    const message = `Assistance Request: ${request}${details ? ` - ${details}` : ''}`;
    return await this.broadcast(message, 'assistance_request', 'high');
  }

  async reportSystemHealth(health: Record<string, any>): Promise<boolean> {
    const message = `System Health: ${JSON.stringify(health)}`;
    return await this.broadcast(message, 'system_health', 'medium');
  }

  private async getNovaStatus(): Promise<Record<string, any>> {
    return {
      agent: 'nova',
      status: 'active',
      capabilities: [
        'reasoning_engine',
        'speech_synthesis',
        'user_interaction',
        'sensory_tools',
        'memory_system'
      ],
      currentTasks: [
        'processing_user_input',
        'managing_conversation',
        'coordinating_with_agents'
      ],
      lastUpdate: new Date().toISOString()
    };
  }

  async getAgentStatuses(): Promise<Record<string, any>> {
    return await this.agentComms.getAgentStatus();
  }

  async cleanup(): Promise<void> {
    await this.agentComms.cleanup();
  }
}
