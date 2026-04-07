/**
 * LiveEngine: SOVEREIGN LIVE BRIDGE (v10.0)
 * -----------------------------------------
 * Manages the low-latency WebSocket connection to Gemini 3.1 Flash.
 * This version connects DIRECTLY to Google for Phase 1 verification.
 */
export class LiveEngine {
    private socket: WebSocket | null = null;
    private onAudioCallback: ((chunk: string) => void) | null = null;
    private onProsodyCallback: ((data: any) => void) | null = null;
    private onToolCallCallback: ((name: string, args: any) => Promise<any>) | null = null;
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
        if (!this.apiKey) {
            console.error("❌ [LiveEngine] CRITICAL: No API key provided.");
        }
    }

    public async connect(systemInstruction: string) {
        if (this.socket) return;
        if (!this.apiKey) throw new Error("API key not found");

        return new Promise<void>((resolve, reject) => {
            const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidirectionalGenerateContent?key=${this.apiKey}`;

            this.socket = new WebSocket(url);

            this.socket.onopen = () => {
                console.log("✅ [LiveEngine] Connected to Gemini 3.1 Flash Live");
                this.send({
                    setup: {
                        model: "models/gemini-2.0-flash-exp",
                        generation_config: {
                            response_modalities: ["audio"],
                            speech_config: {
                                voice_config: { prebuilt_voice_config: { voice_name: "Puck" } } // Placeholder for Nova voice training
                            }
                        },
                        system_instruction: { parts: [{ text: systemInstruction }] }
                    }
                });
                resolve();
            };

            this.socket.onmessage = async (event) => {
                const data = JSON.parse(event.data);

                // Handle Audio
                if (data.serverContent?.modelTurn?.parts) {
                    const part = data.serverContent.modelTurn.parts[0];
                    if (part.inlineData) {
                        this.onAudioCallback?.(part.inlineData.data);
                    }
                }

                // Handle Tool Calls (Sovereign Agency)
                if (data.serverContent?.modelTurn?.parts?.[0]?.toolCall) {
                    const call = data.serverContent.modelTurn.parts[0].toolCall;
                    await this.handleToolCall(call);
                }
            };

            this.socket.onerror = (error) => {
                console.error("❌ [LiveEngine] WebSocket Error:", error);
                reject(error);
            };

            this.socket.onclose = () => {
                console.log("🔌 [LiveEngine] Connection closed");
                this.socket = null;
            };
        });
    }

    private async handleToolCall(call: any) {
        console.log(`🛠️ [LiveEngine] Tool Call: ${call.name}`);
        if (this.onToolCallCallback) {
            const result = await this.onToolCallCallback(call.name, call.args);
            this.send({
                toolResponse: {
                    functionResponses: [{
                        name: call.name,
                        response: { result }
                    }]
                }
            });
        }
    }

    public sendAudio(pcmData: Uint8Array) {
        const base64 = btoa(String.fromCharCode(...pcmData));
        this.send({
            realtime_input: {
                media_chunks: [{
                    mime_type: "audio/pcm;rate=16000",
                    data: base64
                }]
            }
        });
    }

    private send(data: any) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        }
    }

    public onAudio(callback: (chunk: string) => void) {
        this.onAudioCallback = callback;
    }

    public onProsody(callback: (data: any) => void) {
        this.onProsodyCallback = callback;
    }

    public onToolCall(callback: (name: string, args: any) => Promise<any>) {
        this.onToolCallCallback = callback;
    }

    public disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }
}
