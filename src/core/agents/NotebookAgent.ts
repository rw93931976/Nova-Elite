import { supabase } from '../../integrations/supabase';

export interface NotebookMetadata {
    id: string;
    name: string;
    category: 'marketing' | 'social_media' | 'business' | 'technical' | 'unassigned';
    url: string;
    lastSync: string;
}

export class NotebookAgent {
    private activeNotebooks: NotebookMetadata[] = [];

    constructor() {
        this.loadNotebooks();
    }

    private async loadNotebooks() {
        try {
            const { data, error } = await supabase
                .from('nova_memories')
                .select('content')
                .eq('category', 'notebook_registry')
                .maybeSingle();

            if (data && data.content) {
                this.activeNotebooks = JSON.parse(data.content);
            } else {
                console.log('[NotebookAgent] Initializing fresh registry...');
                this.activeNotebooks = [];
            }
        } catch (e) {
            console.error('[NotebookAgent] Failed to load registry:', e);
            this.activeNotebooks = [];
        }
    }

    /**
     * Provides metadata for the Sovereign brain to trigger its own research.
     */
    public async getResearchContext(query: string): Promise<string> {
        const relevant = this.activeNotebooks.find(n =>
            query.toLowerCase().includes(n.category) ||
            n.name.toLowerCase().includes(query.toLowerCase())
        );

        if (relevant) {
            return `[SOVEREIGN_RESOURCE]: Notebook "${relevant.name}" is available at ${relevant.url}. Use your 'read_notebook' tool for deep study.`;
        }

        return "No specific notebook identified for this query.";
    }

    public getRegistry(): NotebookMetadata[] {
        return this.activeNotebooks;
    }
}
