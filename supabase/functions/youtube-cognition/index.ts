import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

    try {
        const { videoId, videoUrl } = await req.json();
        const id = videoId || videoUrl?.match(/(?:v=|\/embed\/|\/1\/|\/v\/|https:\/\/youtu\.be\/)([^"&?\/\s]{11})/)?.[1];

        if (!id) {
            throw new Error("Missing videoId or valid videoUrl");
        }

        console.log(`[YouTube] Processing Video ID: ${id}`);

        // 1. Fetch Video Page HTML
        const htmlRes = await fetch(`https://www.youtube.com/watch?v=${id}`);
        if (!htmlRes.ok) throw new Error(`Failed to fetch YouTube page: ${htmlRes.statusText}`);
        const html = await htmlRes.text();

        // 2. Extract Caption Track URL
        const regex = /["']captionTracks["']\s*:\s*\[\s*\{\s*["']baseUrl["']\s*:\s*["']([^"']+)["']/;
        const match = html.match(regex);
        let captionUrl = match ? match[1].replace(/\\u0026/g, '&') : null;

        if (!captionUrl) {
            const playerRegex = /ytInitialPlayerResponse\s*=\s*({.+?});/;
            const playerMatch = html.match(playerRegex);
            if (playerMatch) {
                const player = JSON.parse(playerMatch[1]);
                captionUrl = player.captions?.playerCaptionsTracklistRenderer?.captionTracks?.[0]?.baseUrl;
            }
        }

        if (!captionUrl) {
            return new Response(JSON.stringify({
                success: false,
                message: "No transcript found for this video. It might be disabled or auto-generated only."
            }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }

        // 3. Fetch and Process Captions
        const xmlRes = await fetch(captionUrl);
        if (!xmlRes.ok) throw new Error(`Failed to fetch transcripts: ${xmlRes.statusText}`);
        const xml = await xmlRes.text();

        const text = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const snippet = text.substring(0, 15000); // Index first 15k chars for immediate reasoning

        // 4. Persistence into memory_hub
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { error } = await supabase.from('memory_hub').upsert({
            notebook_name: `YouTube_${id}`,
            content: `[TRANSCRIPT]\n${text}`, // Store full text
            category: 'study',
            metadata: { video_id: id, source: 'youtube-cognition', length: text.length }
        }, { onConflict: 'notebook_name' });

        if (error) throw error;

        return new Response(JSON.stringify({
            success: true,
            message: "Video ingested and indexed.",
            snippet: snippet,
            videoId: id
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } catch (e: any) {
        console.error("[YouTube] Error:", e.message);
        return new Response(JSON.stringify({ error: e.message }), {
            status: 400,
            headers: corsHeaders,
        });
    }
});
