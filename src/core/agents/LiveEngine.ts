/**
 * LiveEngine: SOVEREIGN RELAY GATEWAY (v10.1)
 * -----------------------------------------
 * Manages the low-latency WebSocket connection to the VPS Relay.
 * This version uses the Sovereign Bridge to protect API keys.
 */
export class LiveEngine {
    private socket: WebSocket | null = null;
    private onAudioCallback: ((chunk: string) => void) | null = null;
    private onProsodyCallback: ((data: any) => void) | null = null;
    private onToolCallCallback: ((name: string, args: any) => Promise<any>) | null = null;
    private onStateChange: ((state: 'connected' | 'disconnected' | 'error', msg?: string) => void) | null = null;

    constructor() {
        console.log("🛰️ [LiveEngine] Initialization (Relay Mode)");
    }

    public async connect(systemInstruction: string) {
        if (this.socket) return;

        return new Promise<void>((resolve, reject) => {
            // SOVEREIGN ENDPOINT: Points to the Secure N8N Tunnel on the VPS
            const relayUrl = `wss://n8n.mysimpleaihelp.com/relay?key=sovereign-secret-12345`;

            console.log(`📡 [Relay] Connecting to Sovereign Gateway: ${relayUrl}`);
            this.socket = new WebSocket(relayUrl);

            this.socket.onopen = () => {
                console.log("✅ [Relay] Connected to Sovereign Gateway");
                this.onStateChange?.('connected');

                // Send SETUP via Relay
                this.send({
                    type: 'setup',
                    setup: {
                        model: "models/gemini-2.0-flash-exp",
                        generation_config: {
                            response_modalities: ["audio"],
                            speech_config: {
                                voice_config: { prebuilt_voice_config: { voice_name: "Puck" } }
                            }
                        },
                        system_instruction: { parts: [{ text: systemInstruction }] }
                    }
                });
                resolve();
            };

            this.socket.onmessage = async (event) => {
                const data = JSON.parse(event.data);

                if (data.type === 'error') {
                    console.error(`❌ [Relay] Error: ${data.message}`);
                    this.onStateChange?.('error', data.message);
                    return;
                }

                // Handle Audio
                if (data.serverContent?.modelTurn?.parts) {
                    const part = data.serverContent.modelTurn.parts[0];
                    if (part.inlineData) {
                        this.onAudioCallback?.(part.inlineData.data);
                    }
                }

                // Handle Tool Calls
                if (data.serverContent?.modelTurn?.parts?.[0]?.toolCall) {
                    const call = data.serverContent.modelTurn.parts[0].toolCall;
                    await this.handleToolCall(call);
                }
            };

            this.socket.onerror = (error) => {
                console.error("❌ [Relay] Connection Error:", error);
                this.onStateChange?.('error', 'Gateway Connection Failed');
                reject(error);
            };

            this.socket.onclose = () => {
                console.log("🔌 [Relay] Gateway Disconnected");
                this.onStateChange?.('disconnected');
                this.socket = null;
            };
        });
    }

    private async handleToolCall(call: any) {
        console.log(`🛠️ [Relay] Executing Tool: ${call.name}`);
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

    public onAudio(callback: (chunk: string) => void) { this.onAudioCallback = callback; }
    public onToolCall(callback: (name: string, args: any) => Promise<any>) { this.onToolCallCallback = callback; }
    public onStatus(callback: (state: 'connected' | 'disconnected' | 'error', msg?: string) => void) { this.onStateChange = callback; }

    public disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }
}
