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
    private SUBJECT_MAP: Record<string, string> = {
        'marketing': '6299b860-938a-419a-9066-eb4659f25163',
        'saas': 'ff96f61e-7ce8-4ecf-9cf1-0843906546cc',
        'business': 'ff96f61e-7ce8-4ecf-9cf1-0843906546cc',
        'psychology': 'a0250c9a-a9c3-4d31-8e5e-462e114b4ff8',
        'personality': '283d34b8-c533-4608-bad9-0ae3b7d65fad',
        'identity': '283d34b8-c533-4608-bad9-0ae3b7d65fad',
        'syllabus': '2644ccd0-5bb0-41f8-b277-c2a563e4bce4',
        'empathy': '2644ccd0-5bb0-41f8-b277-c2a563e4bce4'
    };

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
        const queryLower = query.toLowerCase();

        // 1. Try Subject Map first (Librarian Protocol)
        for (const [subject, id] of Object.entries(this.SUBJECT_MAP)) {
            if (queryLower.includes(subject)) {
                const meta = this.activeNotebooks.find(n => n.id === id);
                return `[LIBRARIAN_DIRECTIVE]: Matching Subject "${subject}" found. 
                Using specific Notebook: "${meta?.name || subject}" (ID: ${id}). 
                PROTOCOL: python scripts/run.py ask_question.py --question "${query}" --notebook-id "${id}"`;
            }
        }

        // 2. Fallback to name/category matching
        const relevant = this.activeNotebooks.find(n =>
            queryLower.includes(n.category) ||
            n.name.toLowerCase().includes(queryLower)
        );

        if (relevant) {
            return `[SOVEREIGN_RESOURCE]: Notebook "${relevant.name}" (ID: ${relevant.id}) is available. 
            EXECUTION_DIRECTIVE: Use the 'notebooklm' skill to query this specific ID. 
            PROTOCOL: python scripts/run.py ask_question.py --question "${query}" --notebook-id "${relevant.id}"`;
        }

        return "No specific notebook identified for this query. Defaulting to general reasoning or use the 'Sovereign Master Syllabus' (ID: 2644ccd0-5bb0-41f8-b277-c2a563e4bce4).";
    }

    public getRegistry(): NotebookMetadata[] {
        return this.activeNotebooks;
    }
}
