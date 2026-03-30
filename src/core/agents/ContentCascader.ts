import { OpenAI } from 'openai';

/**
 * CONTENT CASCADER (v1.0)
 * Subject 63: Advanced Content Cascading (1 to 100)
 * Purpose: Transforms a single source (Transcript/Video) into a swarm of social assets.
 */

export class ContentCascader {
    private client: OpenAI;

    constructor(apiKey: string) {
        this.client = new OpenAI({ apiKey });
    }

    async cascade(sourceContent: string, targetCount: number = 10): Promise<any[]> {
        console.log(`🌀 [Cascader] Splitting source into ${targetCount} atomic units...`);

        const prompt = `
            You are the "1 to 100" Content Cascader for Nova Elite.
            SOURCE CONTENT: ${sourceContent.substring(0, 5000)}...
            
            TASK: Generate ${targetCount} unique, high-impact social media assets.
            CHANNELS: TikTok, Instagram Reels, Twitter Threads, LinkedIn Articles, YouTube Shorts.
            
            FORMAT: Return a JSON array of objects:
            { "platform": "string", "type": "hook|story|educational|controversial", "text": "string" }
            
            STYLE: Ray's Wit (Dry Humor, Executive Authority, Top 1% focus).
        `;

        const response = await this.client.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "system", content: prompt }],
            response_format: { type: "json_object" }
        });

        const assets = JSON.parse(response.choices[0].message.content || "{}").assets || [];
        return assets;
    }
}
