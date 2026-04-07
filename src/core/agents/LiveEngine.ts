import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * SOVEREIGN LIVE ENGINE v10.0
 * --------------------------
 * Handles the low-latency, multimodal WebSocket connection to Gemini 3.1 Flash Live.
 * Preserves the Sovereign Persona and integrates with the local VPC bridge.
 */
export class LiveEngine {
    private genAI: any;
    private session: any;
    private audioContext: AudioContext | null = null;
    private onAudioCallback: ((chunk: string) => void) | null = null;
    private onProsodyCallback: ((data: any) => void) | null = null;
    private onToolCallCallback: ((name: string, args: any) => Promise<any>) | null = null;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    /**
     * INITIATE LIVE SESSION
     * Connects to the multimodalLive endpoint with the Sovereign Persona.
     */
    public async connect(systemInstruction: string) {
        console.log("🛰️ [LiveEngine] Initiating Sovereign Live connection...");
        try {
            // Using the new Gemini 3.1 Flash Live model via the SDK extension
            // Note: In March 2026, the SDK supports native multimodal live sessions.
            const model = this.genAI.getGenerativeModel({ model: "gemini-3.1-flash-live" });

            this.session = await (model as any).startLiveSession({
                systemInstruction,
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024,
                },
                tools: [
                    {
                        functionDeclarations: [
                            {
                                name: "web_search",
                                description: "Search the web for real-time information.",
                                parameters: { type: "OBJECT", properties: { query: { type: "STRING" } }, required: ["query"] }
                            },
                            {
                                name: "read_file",
                                description: "Read a local file from the disk.",
                                parameters: { type: "OBJECT", properties: { path: { type: "STRING" } }, required: ["path"] }
                            },
                            {
                                name: "write_file",
                                description: "Write content to a local file.",
                                parameters: { type: "OBJECT", properties: { path: { type: "STRING" }, content: { type: "STRING" } }, required: ["path", "content"] }
                            }
                        ]
                    }
                ]
            });

            this.session.on('audio', (chunk: any) => {
                if (this.onAudioCallback) {
                    this.onAudioCallback(chunk.data);
                }

                // SOVEREIGN SOUL TRAINING: Emit prosody markers for the trainer
                if (this.onProsodyCallback && chunk.metadata) {
                    this.onProsodyCallback({
                        prosody: chunk.metadata.prosody,
                        interactionId: chunk.metadata.id
                    });
                }
            });

            this.session.on('tool_call', async (call: any) => {
                console.log(`🛠️ [LiveEngine] Tool Call: ${call.name}`, call.args);
                if (this.onToolCallCallback) {
                    const result = await this.onToolCallCallback(call.name, call.args);
                    this.session.sendToolResponse({
                        callId: call.id,
                        response: { result }
                    });
                }
            });

            this.session.on('error', (err: any) => {
                console.error("❌ [LiveEngine] Session Error:", err);
            });

            console.log("✅ [LiveEngine] Sovereign Live Active.");
        } catch (err) {
            console.error("❌ [LiveEngine] Connection Failed:", err);
            throw err;
        }
    }

    /**
     * SEND AUDIO STREAM
     * Sends PCM audio data from the browser mic to the model.
     */
    public sendAudio(pcmData: Uint8Array) {
        if (this.session) {
            this.session.sendAudio(pcmData);
        }
    }

    /**
     * LISTEN FOR AUDIO
     * Register a callback for the returned audio stream.
     */
    public onAudio(callback: (chunk: string) => void) {
        this.onAudioCallback = callback;
    }

    /**
     * SOVEREIGN SOUL TRAINING
     * Register a callback for prosody metadata.
     */
    public onProsody(callback: (data: any) => void) {
        this.onProsodyCallback = callback;
    }

    /**
     * SOVEREIGN AGENCY
     * Register a callback to handle tool execution.
     */
    public onToolCall(callback: (name: string, args: any) => Promise<any>) {
        this.onToolCallCallback = callback;
    }

    /**
     * DISCONNECT (Economy Mode)
     * Kills the live session to save tokens/cost.
     */
    public disconnect() {
        if (this.session) {
            this.session.close();
            this.session = null;
            console.log("💤 [LiveEngine] Session Disconnected (Economy Mode).");
        }
    }

    public isConnected(): boolean {
        return !!this.session;
    }
}
