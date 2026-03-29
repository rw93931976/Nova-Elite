import { supabase } from '../../integrations/supabase';

export class DiscoveryAgent {
    private readonly TAVILY_API_KEY = import.meta.env.VITE_TAVILY_API_KEY;

    constructor() { }

    public async search(query: string): Promise<string> {
        if (!this.TAVILY_API_KEY) {
            console.warn('[Discovery] Tavily API Key missing. Falling back to relay.');
            return "";
        }

        try {
            console.log(`[Discovery] Performing direct Tavily search: ${query}`);
            const response = await fetch('https://api.tavily.com/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    api_key: this.TAVILY_API_KEY,
                    query: query,
                    search_depth: "advanced",
                    include_answer: true,
                    max_results: 5
                })
            });

            if (response.ok) {
                const data = await response.json();
                return data.answer || data.results.map((r: any) => r.content).join('\n\n');
            }
            throw new Error(`Tavily error: ${response.statusText}`);
        } catch (e) {
            console.error('[Discovery] Direct search failed:', e);
            return "";
        }
    }

    /**
     * Stage 5: Video Cognition
     * Ingests YouTube transcripts into memory.
     */
    public async videoCognition(videoUrl: string): Promise<string> {
        console.log(`[Discovery] Initiating Video Cognition: ${videoUrl}`);
        try {
            const response = await fetch(`${supabase.supabaseUrl}/functions/v1/youtube-cognition`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabase.supabaseKey}`
                },
                body: JSON.stringify({ videoUrl })
            });
            const data = await response.json();
            return data.snippet || data.message;
        } catch (e) {
            console.error('[Discovery] Video cognition failed:', e);
            return "Cognition pulse failed.";
        }
    }

    /**
     * Stage 6: Tool Blueprinting
     * Researches specific APIs or SDKs to build a NEW tool.
     */
    public async getToolBlueprint(toolName: string): Promise<string> {
        const query = `How to implement a ${toolName} agent in TypeScript/Vite? Provide API endpoints and NPM package names.`;
        const research = await this.search(query);
        return research;
    }

    /**
     * Stage 6: Autonomous Agent Drafting
     * Generates a structural code template based on research.
     */
    public draftAgentCode(name: string, blueprint: string): string {
        return `
/**
 * AUTO-GENERATED SOVEREIGN AGENT: ${name}
 * Created for: System Scale Evolution (Stage 6)
 * Blueprint: ${blueprint.slice(0, 100)}...
 */
export class ${name} {
    constructor() {
        console.log("${name} Initialized via Discovery Pulse.");
    }
}
        `;
    }

    /**
     * Stage 7: Autonomous Scribe
     * Directly writes her research to the local 'nova-data/briefings' folder via the Relay.
     */
    public async scribeBriefing(filename: string, content: string): Promise<string> {
        console.log(`🚀 [SOVEREIGN SCRIBE]: ${filename}`);

        try {
            const { data: job, error: jobErr } = await supabase
                .from('relay_jobs')
                .insert({
                    type: 'write_file',
                    payload: { path: `nova-data/briefings/${filename}`, content },
                    status: 'pending'
                })
                .select('id')
                .single();

            if (jobErr) throw jobErr;

            // Optional: Notify Architect immediately
            await supabase.from('agent_architect_comms').insert([{
                sender: 'nova',
                message: `SCRIBE_INITIATED: ${filename}`,
                metadata: { job_id: job.id }
            }]);

            return job.id;
        } catch (e) {
            console.error('[Scribe] Failed to queue briefing:', e);
            return "SCRIBE_ERROR";
        }
    }
}
