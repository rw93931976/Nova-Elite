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
     * v10.0: Re-wired to use the localized 'notebooklm' skill.
     */
    public async getResearchContext(query: string): Promise<string> {
        const relevant = this.activeNotebooks.find(n =>
            query.toLowerCase().includes(n.category) ||
            n.name.toLowerCase().includes(query.toLowerCase())
        );

        if (relevant) {
            return `[SOVEREIGN_RESOURCE]: Notebook "${relevant.name}" (ID: ${relevant.id}) is available. 
            EXECUTION_DIRECTIVE: Use the 'notebooklm' skill to query this specific ID for source-grounded answers. 
            PROTOCOL: python scripts/run.py ask_question.py --question "${query}" --notebook-id "${relevant.id}"`;
        }

        return "No specific notebook identified for this query. Use general knowledge or propose a new notebook addition via the 'notebooklm' add tool.";
    }

    public getRegistry(): NotebookMetadata[] {
        return this.activeNotebooks;
    }
}
