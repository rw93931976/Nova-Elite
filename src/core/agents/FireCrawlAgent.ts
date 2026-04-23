/**
 * FireCrawlAgent: DIGITAL VISION CORE (v14.0)
 * -----------------------------------------
 * This agent talks to the Managed FireCrawl Proxy on the VPS.
 */
export class FireCrawlAgent {
    constructor() { }

    /**
     * Searches the web using the Sovereign Pulse (VPS Bridge) FireCrawl proxy.
     */
    public async search(query: string): Promise<string> {
        console.log(`🔍 [FireCrawl] Visual Scan for: ${query}...`);

        try {
            const response = await fetch('http://nova.mysimpleaihelp.com:3515/research/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });

            const data = await response.json();
            if (data.success) {
                return JSON.stringify(data.result);
            } else {
                return `[FIRECRAWL_ERROR]: ${data.error || 'Unknown cortex failure'}`;
            }
        } catch (e: any) {
            console.error("❌ FireCrawl Link Severed:", e);
            return `[FIRECRAWL_OFFLINE]: ${e.message}`;
        }
    }
}
