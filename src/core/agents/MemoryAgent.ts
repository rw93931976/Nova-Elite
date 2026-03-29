import { supabase } from '../../integrations/supabase';

export class MemoryAgent {
    private memories: any[] = [];
    private lastFetch: number = 0;
    private readonly CACHE_TTL = 3600000; // 1 hour (Egress optimization)

    public async getRelevantMemories(): Promise<string> {
        try {
            await this.syncMemories();
            if (this.memories.length === 0) return "";

            let context = "\n### LONG-TERM MEMORIES & PREFERENCES:\n";
            this.memories.forEach(m => {
                context += `- [${m.category}]: ${m.content}\n`;
            });
            return context;
        } catch (e) {
            console.warn('[Memory] Failed to retrieve memories:', e);
            return "";
        }
    }

    public async recordMemory(content: string, category: string = 'fact') {
        try {
            const { error } = await supabase
                .from('nova_memories')
                .insert({ content, category, importance: 1 });

            if (!error) {
                // Hot reload cache after recording
                this.lastFetch = 0;
                await this.syncMemories();
            }
        } catch (e) {
            console.warn('[Memory] Failed to record memory:', e);
        }
    }

    private async syncMemories() {
        try {
            const now = Date.now();
            if (now - this.lastFetch < this.CACHE_TTL) return;

            const { data, error } = await supabase
                .from('nova_memories')
                .select('*')
                .order('importance', { ascending: false })
                .limit(20);

            if (!error && data) {
                this.memories = data;
                this.lastFetch = now;
            }
        } catch (e) {
            console.warn('[Memory] Sync failed:', e);
        }
    }

    /**
     * Autonomous Extraction Logic:
     * This identifies if the user mentioned a fact or preference
     * that should be remembered cross-session.
     */
    public async extractFactsFromInput(input: string, executeRelay: (type: string, payload: any) => Promise<any>) {
        // Skip extraction for very short messages
        if (input.length < 10) return;

        const extractionPrompt = `Extract any personal facts, preferences, or upcoming events from Ray's input.
        Input: "${input}"
        Respond ONLY with a JSON array of facts to remember, or an empty array [].
        Example: ["Ray is traveling to Dallas today.", "Ray prefers concise responses."]`;

        try {
            const result = await executeRelay('llm', {
                provider: 'openai',
                payload: {
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'system', content: extractionPrompt }]
                }
            });

            const raw = result.response || result.data?.choices?.[0]?.message?.content;
            if (raw) {
                const facts = JSON.parse(raw.match(/\[.*\]/s)[0]);
                for (const fact of facts) {
                    await this.recordMemory(fact, 'fact');
                    console.log(`[Memory] Learned new fact: ${fact}`);
                }
            }
        } catch (e) {
            console.warn('[Memory] Extraction failed:', e);
        }
    }
}
