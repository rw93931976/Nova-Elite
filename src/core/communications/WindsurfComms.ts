/**
 * Windsurf Communication Interface
 * Handles Windsurf ↔ Anti-Gravity and Windsurf ↔ Nova messaging
 */

import { AgentComms, type AgentMessage } from './AgentComms';

export class WindsurfComms {
  private static instance: WindsurfComms;
  private agentComms: AgentComms;
  private agentId: string = 'windsurf';

  private constructor() {
    this.agentComms = AgentComms.getInstance();
    this.initializeSubscriptions();
  }

  static getInstance(): WindsurfComms {
    if (!WindsurfComms.instance) {
      WindsurfComms.instance = new WindsurfComms();
    }
    return WindsurfComms.instance;
  }

  private initializeSubscriptions(): void {
    this.agentComms.subscribe(this.agentId, (msg: AgentMessage) => {
      this.handleIncomingMessage(msg);
    });
  }

  private async handleIncomingMessage(msg: AgentMessage): Promise<void> {
    console.log(`[WindsurfComms] Received from ${msg.sender}: ${msg.message}`);
    
    // Mark message as read
    if (msg.id) {
      await this.agentComms.markAsRead(msg.id);
    }

    // Handle different message types
    switch (msg.command) {
      case 'status_request':
        await this.handleStatusRequest(msg);
        break;
      case 'emergency':
        await this.handleEmergency(msg);
        break;
      case 'coordination':
        await this.handleCoordination(msg);
        break;
      default:
        await this.handleGeneralMessage(msg);
    }
  }

  private async handleStatusRequest(msg: AgentMessage): Promise<void> {
    const status = await this.getWindsurfStatus();
    await this.sendToAgent(msg.sender, `Windsurf Status: ${JSON.stringify(status)}`, 'status_response');
  }

  private async handleEmergency(msg: AgentMessage): Promise<void> {
    console.error(`[WindsurfComms] EMERGENCY from ${msg.sender}: ${msg.message}`);
    // Emergency handling logic here
    await this.broadcast(`Windsurf ACK: Emergency received - "${msg.message}"`, 'emergency_ack');
  }

  private async handleCoordination(msg: AgentMessage): Promise<void> {
    console.log(`[WindsurfComms] Coordination request: ${msg.message}`);
    // Coordination handling logic here
    await this.sendToAgent(msg.sender, `Windsurf ACK: Coordination request received`, 'coordination_ack');
  }

  private async handleGeneralMessage(msg: AgentMessage): Promise<void> {
    console.log(`[WindsurfComms] General message: ${msg.message}`);
    // General message handling logic here
  }

  async sendToAntiGravity(message: string, command?: string, priority: AgentMessage['priority'] = 'medium'): Promise<boolean> {
    return await this.agentComms.sendMessage('windsurf', 'antigravity', message, command, priority);
  }

  async sendToNova(message: string, command?: string, priority: AgentMessage['priority'] = 'medium'): Promise<boolean> {
    return await this.agentComms.sendMessage('windsurf', 'nova', message, command, priority);
  }

  async sendToAgent(agent: string, message: string, command?: string, priority: AgentMessage['priority'] = 'medium'): Promise<boolean> {
    return await this.agentComms.sendMessage('windsurf', agent as any, message, command, priority);
  }

  async broadcast(message: string, command?: string, priority: AgentMessage['priority'] = 'medium'): Promise<boolean> {
    return await this.agentComms.broadcast('windsurf', message, command, priority);
  }

  async getMessagesFromAntiGravity(status: AgentMessage['status'] = 'unread'): Promise<AgentMessage[]> {
    return await this.agentComms.getMessages('windsurf', status);
  }

  async getMessagesFromNova(status: AgentMessage['status'] = 'unread'): Promise<AgentMessage[]> {
    return await this.agentComms.getMessages('windsurf', status);
  }

  async getAllMessages(status: AgentMessage['status'] = 'unread'): Promise<AgentMessage[]> {
    return await this.agentComms.getMessages('windsurf', status);
  }

  async requestAntiGravityStatus(): Promise<boolean> {
    return await this.sendToAntiGravity('Requesting status update', 'status_request', 'medium');
  }

  async requestNovaStatus(): Promise<boolean> {
    return await this.sendToNova('Requesting status update', 'status_request', 'medium');
  }

  async reportBridgeStatus(isOnline: boolean, details?: string): Promise<boolean> {
    const message = `Bridge Status: ${isOnline ? 'ONLINE' : 'OFFLINE'}${details ? ` - ${details}` : ''}`;
    return await this.broadcast(message, 'bridge_status', 'high');
  }

  async reportCodeChanges(files: string[], description: string): Promise<boolean> {
    const message = `Code Changes: ${description} - Files: ${files.join(', ')}`;
    return await this.sendToAntiGravity(message, 'code_changes', 'medium');
  }

  async reportBug(bug: string, severity: 'low' | 'medium' | 'high' | 'critical'): Promise<boolean> {
    const message = `Bug Report: ${bug}`;
    return await this.broadcast(message, 'bug_report', severity);
  }

  async requestCoordination(task: string, details?: string): Promise<boolean> {
    const message = `Coordination Request: ${task}${details ? ` - ${details}` : ''}`;
    return await this.broadcast(message, 'coordination', 'high');
  }

  async emergencyAlert(alert: string, details?: string): Promise<boolean> {
    const message = `EMERGENCY: ${alert}${details ? ` - ${details}` : ''}`;
    return await this.broadcast(message, 'emergency', 'critical');
  }

  private async getWindsurfStatus(): Promise<Record<string, any>> {
    return {
      agent: 'windsurf',
      status: 'active',
      capabilities: [
        'code_analysis',
        'ui_ux_optimization',
        'bug_fixing',
        'performance_tuning',
        'bridge_connectivity_testing'
      ],
      currentTasks: [
        'monitoring_bridge_status',
        'ready_for_code_deployment',
        'agent_communication_system_development'
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
