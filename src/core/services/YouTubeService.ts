import { supabase } from '../../integrations/supabase';

export interface VideoStrategy {
    id?: string;
    url: string;
    title: string;
    summary: string;
    sop_steps: string[];
    strategic_value: number; // 0-100
    created_at?: string;
}

export const YouTubeService = {
    /**
     * Extracts video ID from common YT link formats
     */
    extractVideoId(url: string): string | null {
        const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
        const match = url.match(regex);
        return match ? match[1] : null;
    },

    /**
     * Digest a video into a Sovereign Strategy
     * (Interface for the Reasoning Engine to call after getting transcript)
     */
    async saveStrategy(strategy: VideoStrategy) {
        const { data, error } = await supabase
            .from('nova_strategies')
            .insert([strategy])
            .select();

        if (error) throw error;
        return data?.[0];
    },

    /**
     * Get all saved strategies
     */
    async getVault() {
        const { data, error } = await supabase
            .from('nova_strategies')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as VideoStrategy[];
    },

    /**
     * Triggers a digest request (sends to Reasoning Engine via window event)
     */
    triggerDigest(url: string) {
        const event = new CustomEvent('nova:digest_youtube', { detail: { url } });
        window.dispatchEvent(event);
    }
};
