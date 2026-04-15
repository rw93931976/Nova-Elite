import { supabase } from '../../integrations/supabase';

/**
 * 👁️ GEMINI SENSE AGENT (Multimodal Ingestion)
 * -------------------------------------------
 * The "Eyes" of the Hybrid Model.
 * Specifically handles multimodal ingestion (Vision, Audio Transcripts, Meetings)
 * using Gemini 1.5 Pro via the Sovereign Brain bridge.
 */
export class GeminiSenseAgent {
    constructor() { }

    /**
     * Processes a multimodal payload (Video file, Audio stream, or Image).
     * Dispatches to the Gemini-powered Sovereign Brain.
     */
    public async perceive(payload: { type: 'video' | 'audio' | 'image', source: string, context?: string }): Promise<string> {
        console.log(`[GeminiSenseAgent] Perceiving ${payload.type} from ${payload.source}...`);

        // This coordinates with the sovereign-brain edge function to trigger 
        // Gemini-specific native multimodal processing.
        try {
            const { data, error } = await supabase.functions.invoke('sovereign-brain', {
                body: {
                    input: `SENSORY_TASK: Percieve this ${payload.type} source.`,
                    multimodal_payload: {
                        source: payload.source,
                        type: payload.type
                    },
                    persona: "You are the 'Eyes' of Nova. Provide high-fidelity strategic descriptions.",
                    directive: payload.context || "Extract strategic business value and emotional cues."
                }
            });

            if (error) throw error;
            return data.response;
        } catch (e: any) {
            console.error('[GeminiSenseAgent] Ingestion failed:', e.message);
            return `[SENSORY_FAILURE]: I encountered friction while attempting to 'see' the ${payload.type}. Error: ${e.message}`;
        }
    }

    /**
     * Generates a context injection for the Reasoning Engine.
     */
    public async getSensoryContext(): Promise<string> {
        // Placeholder for recent perceptions memory
        return "[SENSORY_ACTIVE]: Multimodal bridge is standing by for high-fidelity ingestion.";
    }
}
