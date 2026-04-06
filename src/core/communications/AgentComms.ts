/**
 * Agent Communication System - 3-Way Coordination Hub
 * Supports: Nova ↔ Windsurf ↔ Anti-Gravity communication
 */

import { supabase } from '../../integrations/supabase';

export interface AgentMessage {
  id?: string;
  sender: 'nova' | 'windsurf' | 'antigravity' | 'vps_heartbeat';
  recipient: 'nova' | 'windsurf' | 'antigravity' | 'all';
  message: string;
  command?: string;
  status: 'unread' | 'read' | 'processed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  created_at?: string;
  metadata?: Record<string, any>;
}

export class AgentComms {
  private static instance: AgentComms;
  private subscriptions: Map<string, (msg: AgentMessage) => void> = new Map();
  private channel: any = null;

  private constructor() {
    this.initializeRealtime();
  }

  static getInstance(): AgentComms {
    if (!AgentComms.instance) {
      AgentComms.instance = new AgentComms();
    }
    return AgentComms.instance;
  }

  private async initializeRealtime() {
    try {
      // Listen for ALL messages (direct + broadcasts)
      this.channel = supabase
        .channel('agent_coordination')
        .on('postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'agent_architect_comms'
            // REMOVED filter to receive ALL messages
          },
          (payload: any) => {
            const message = payload.new as AgentMessage;
            this.broadcastMessage(message);
          }
        )
        .subscribe((status: string) => {
          console.log(`[AgentComms] Realtime subscription: ${status}`);
        });
    } catch (e) {
      console.error('[AgentComms] Realtime initialization failed:', e);
    }
  }

  async sendMessage(
    sender: AgentMessage['sender'],
    recipient: AgentMessage['recipient'],
    message: string,
    command?: string,
    priority: AgentMessage['priority'] = 'medium',
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      const messageData: Partial<AgentMessage> = {
        sender,
        recipient,
        message,
        command,
        priority,
        status: 'unread',
        metadata
      };

      const { error } = await supabase
        .from('agent_architect_comms')
        .insert(messageData);

      if (error) {
        console.error('[AgentComms] Send failed:', error);
        return false;
      }

      console.log(`[AgentComms] ${sender} → ${recipient}: ${message}`);
      return true;
    } catch (e) {
      console.error('[AgentComms] Send error:', e);
      return false;
    }
  }

  async broadcast(
    sender: AgentMessage['sender'],
    message: string,
    command?: string,
    priority: AgentMessage['priority'] = 'medium'
  ): Promise<boolean> {
    return this.sendMessage(sender, 'all', message, command, priority);
  }

  async getMessages(
    recipient: string,
    status: AgentMessage['status'] = 'unread',
    limit: number = 50
  ): Promise<AgentMessage[]> {
    try {
      const { data, error } = await supabase
        .from('agent_architect_comms')
        .select('*')
        .eq('recipient', recipient)
        .eq('status', status)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('[AgentComms] Get messages failed:', error);
        return [];
      }

      return data || [];
    } catch (e) {
      console.error('[AgentComms] Get messages error:', e);
      return [];
    }
  }

  async markAsRead(messageId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('agent_architect_comms')
        .update({ status: 'read' })
        .eq('id', messageId);

      if (error) {
        console.error('[AgentComms] Mark as read failed:', error);
        return false;
      }

      return true;
    } catch (e) {
      console.error('[AgentComms] Mark as read error:', e);
      return false;
    }
  }

  async markAsProcessed(messageId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('agent_architect_comms')
        .update({ status: 'processed' })
        .eq('id', messageId);

      if (error) {
        console.error('[AgentComms] Mark as processed failed:', error);
        return false;
      }

      return true;
    } catch (e) {
      console.error('[AgentComms] Mark as processed error:', e);
      return false;
    }
  }

  subscribe(agentId: string, callback: (msg: AgentMessage) => void): void {
    this.subscriptions.set(agentId, callback);
    console.log(`[AgentComms] ${agentId} subscribed to messages`);
  }

  unsubscribe(agentId: string): void {
    this.subscriptions.delete(agentId);
    console.log(`[AgentComms] ${agentId} unsubscribed`);
  }

  private broadcastMessage(message: AgentMessage): void {
    this.subscriptions.forEach((callback, agentId) => {
      if (message.recipient === 'all' || message.recipient === agentId) {
        try {
          callback(message);
        } catch (e) {
          console.error(`[AgentComms] Callback error for ${agentId}:`, e);
        }
      }
    });
  }

  async getAgentStatus(): Promise<Record<string, any>> {
    try {
      // Get latest heartbeat from each agent
      const { data: novaMessages } = await supabase
        .from('agent_architect_comms')
        .select('created_at, message')
        .eq('sender', 'nova')
        .order('created_at', { ascending: false })
        .limit(1);

      const { data: windsurfMessages } = await supabase
        .from('agent_architect_comms')
        .select('created_at, message')
        .eq('sender', 'windsurf')
        .order('created_at', { ascending: false })
        .limit(1);

      const { data: antigravityMessages } = await supabase
        .from('agent_architect_comms')
        .select('created_at, message')
        .eq('sender', 'antigravity')
        .order('created_at', { ascending: false })
        .limit(1);

      return {
        nova: {
          lastSeen: novaMessages?.[0]?.created_at,
          lastMessage: novaMessages?.[0]?.message,
          status: novaMessages?.[0] ? 'active' : 'offline'
        },
        windsurf: {
          lastSeen: windsurfMessages?.[0]?.created_at,
          lastMessage: windsurfMessages?.[0]?.message,
          status: windsurfMessages?.[0] ? 'active' : 'offline'
        },
        antigravity: {
          lastSeen: antigravityMessages?.[0]?.created_at,
          lastMessage: antigravityMessages?.[0]?.message,
          status: antigravityMessages?.[0] ? 'active' : 'offline'
        },
        vps: {
          status: 'online' // Passive online (Sovereign Silence)
        }
      };
    } catch (e) {
      console.error('[AgentComms] Status check failed:', e);
      return {};
    }
  }

  async cleanup(): Promise<void> {
    if (this.channel) {
      await supabase.removeChannel(this.channel);
    }
    this.subscriptions.clear();
  }
}
