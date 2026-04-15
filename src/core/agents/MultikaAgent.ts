import { supabase } from '../../integrations/supabase';

export interface CollaborativeTask {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed' | 'blocked';
    assignee: 'nova' | 'ray' | 'joint';
    priority: 'low' | 'medium' | 'high' | 'critical';
    metadata?: any;
}

/**
 * 🕹️ MULTIKA AGENT (Collaborative Sandbox)
 * ---------------------------------------
 * Inspired by the Multika "Mission Control" model.
 * Handles the collaborative KanBan/Sandbox logic where Ray and Nova 
 * work side-by-side on high-level strategic tasks.
 */
export class MultikaAgent {
    constructor() { }

    /**
     * Synchronizes the collaborative task board from Supabase.
     */
    public async getBoardState(): Promise<CollaborativeTask[]> {
        const { data, error } = await supabase
            .from('nova_tasks')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[MultikaAgent] Failed to fetch board:', error);
            return [];
        }

        return data as CollaborativeTask[];
    }

    /**
     * Proposes a new task to the collaborative sandbox.
     */
    public async proposeTask(task: Omit<CollaborativeTask, 'id'>): Promise<boolean> {
        const { error } = await supabase
            .from('nova_tasks')
            .insert(task);

        if (error) {
            console.error('[MultikaAgent] Failed to propose task:', error);
            return false;
        }

        return true;
    }

    /**
     * Generates a "Mission Control" summary for the AI persona.
     */
    public async getMissionBriefing(): Promise<string> {
        const tasks = await this.getBoardState();
        const active = tasks.filter(t => t.status === 'in_progress' || t.status === 'blocked');

        if (active.length === 0) {
            return "Mission Control: Idle. All strategic objectives are currently aligned or archived.";
        }

        const brief = active.map(t => `- [${t.status.toUpperCase()}] ${t.title} (${t.assignee})`).join('\n');
        return `### MISSION CONTROL BOARD (COLLABORATIVE SANDBOX)\n${brief}\n\nREASONING: How can we move these levers forward today?`;
    }
}
