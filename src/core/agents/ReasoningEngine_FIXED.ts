// Fixed executeRelayJob with proper response normalization
private async executeRelayJob(type: string, payload: any): Promise<any> {
    console.log(`[Relay] Dispatching ${type} job to Supabase...`);
    
    try {
        const { data, error } = await supabase
            .from('relay_jobs')
            .insert({ type, payload, status: 'pending' })
            .select()
            .single();

        if (error) throw error;

        const jobId = data.id;
        let attempts = 0;
        
        while (attempts < 45) {
            const { data: job, error: pollError } = await supabase
                .from('relay_jobs')
                .select('*')
                .eq('id', jobId)
                .single();

            if (pollError) throw pollError;
            
            if (job.status === 'completed') {
                console.log(`[Relay] Job ${jobId} completed.`);
                
                // NORMALIZE: Extract text from Gemini response
                const rawResult = job.result;
                let extractedText = '';
                
                // Handle different response formats
                if (rawResult?.candidates?.[0]?.content?.parts?.[0]?.text) {
                    extractedText = rawResult.candidates[0].content.parts[0].text;
                } else if (rawResult?.response?.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
                    extractedText = rawResult.response.data.candidates[0].content.parts[0].text;
                } else if (typeof rawResult === 'string') {
                    extractedText = rawResult;
                } else if (rawResult?.results?.[0]?.Content) {
                    extractedText = rawResult.results[0].Content;
                } else if (rawResult?.current?.temperature) {
                    // Weather specific formatting
                    extractedText = `Weather in ${payload.location || 'your area'}: ${rawResult.current.temperature}°F. ${rawResult.forecast || 'No forecast available.'}`;
                }
                
                return {
                    success: true,
                    response: extractedText || "I received data but couldn't process it.",
                    raw: rawResult
                };
            }
            
            if (job.status === 'failed') {
                throw new Error(job.error || 'Job failed on VPS');
            }

            await new Promise(r => setTimeout(r, 1000));
            attempts++;
        }
        
        throw new Error('Relay job timed out after 45s');
    } catch (e: any) {
        console.error('[Relay] Failure:', e.message);
        return {
            success: false,
            response: null,
            error: e.message
        };
    }
}

// Fixed weather search handler
private async handleWeatherSearch(observation: any) {
    const location = this.extractLocation(observation.input);
    const result = await this.executeRelayJob('weather_search', { 
        query: `current weather in ${location}`,
        location 
    });
    
    if (result.success && result.response) {
        return {
            response: result.response,
            diagnostic: 'Weather data retrieved'
        };
    }
    
    // Fallback to direct Gemini call
    return await this.absoluteGoogleFallback(
        "You are a weather assistant. Provide current weather information.",
        observation.input
    );
}

private extractLocation(input: string): string {
    const weatherMatch = input.match(/weather (?:in|for) ([a-zA-Z\s]+?)(?:\?|$|\.)/i);
    if (weatherMatch) return weatherMatch[1].trim();
    
    const locationKeywords = ['in', 'at', 'for'];
    for (const keyword of locationKeywords) {
        const idx = input.toLowerCase().indexOf(keyword);
        if (idx !== -1) {
            const after = input.slice(idx + keyword.length).trim();
            const firstWord = after.match(/^[a-zA-Z\s]+/);
            if (firstWord) return firstWord[0].trim();
        }
    }
    
    return "Nashville"; // Default
}
