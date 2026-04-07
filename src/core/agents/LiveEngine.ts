/**
 * LiveEngine: SOVEREIGN LIVE ENGINE v11.0 (Relay Mode)
 * --------------------------------------------------
 * A "Thin Client" that connects to the Sovereign Node (VPS) instead of Google.
 * Enforces "Keyless" architecture where credentials NEVER leave the server.
 */
export class LiveEngine {
    private socket: WebSocket | null = null;
    private onAudioCallback: ((chunk: string) => void) | null = null;
    private onProsodyCallback: ((data: any) => void) | null = null;
    private onToolCallCallback: ((name: string, args: any) => Promise<any>) | null = null;

    constructor() {
        console.log("🌑 [LiveEngine] Sovereign Relay Interface Initialized.");
    }

    /**
     * INITIATE RELAY SESSION
     * Connects to the VPS Bridge which holds the Gemini Session.
     */
    public async connect(systemInstruction: string) {
        if (this.socket) return;

        return new Promise<void>((resolve, reject) => {
            try {
                // RELAY ENDPOINT: Points back to the Sovereign VPS
                // We use the public URL for Ray's mobile device connectivity.
                const relayUrl = "wss://api.mysimpleaihelp.com:3506";
                console.log(`🛰️ [Relay] Handshaking with Sovereign Node: ${relayUrl}`);

                this.socket = new WebSocket(relayUrl);

                this.socket.onopen = () => {
                    console.log("✅ [Relay] Secure Pipe Established.");
                    this.send({
                        type: "setup",
                        setup: {
                            model: "models/gemini-2.0-flash-exp",
                            generation_config: {
                                response_modalities: ["audio"],
                                system_instruction: systemInstruction
                            }
                        }
                    });
                    resolve();
                };

                this.socket.onmessage = async (event) => {
                    try {
                        const data = JSON.parse(event.data);

                        // Handle Tool Calls or Model Content
                        if (data.toolCall) {
                            await this.handleToolCall(data.toolCall);
                        } else if (data.serverContent?.modelTurn?.parts) {
                            const part = data.serverContent.modelTurn.parts[0];
                            if (part.inlineData) {
                                this.onAudioCallback?.(part.inlineData.data);
                            }
                        }
                    } catch (e) {
                        // Binary fallback if the relay pipes fragments
                    }
                };

                this.socket.onerror = (error) => {
                    console.error("❌ [Relay] Socket Error:", error);
                    reject(error);
                };

                this.socket.onclose = () => {
                    console.log("🔌 [Relay] Session Sealed.");
                    this.socket = null;
                };

            } catch (error) {
                reject(error);
            }
        });
    }

    private async handleToolCall(call: any) {
        console.log(`🛠️ [Relay] Distributed Tool Execution: ${call.name}`);
        if (this.onToolCallCallback) {
            const result = await this.onToolCallCallback(call.name, call.args);
            this.send({
                toolResponse: {
                    callId: call.id,
                    response: { result }
                }
            });
        }
    }

    public sendAudio(pcmData: Uint8Array) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            const base64 = btoa(String.fromCharCode(...pcmData));
            this.send({
                realtimeInput: {
                    mediaChunks: [{
                        mimeType: "audio/pcm;rate=16000",
                        data: base64
                    }]
                }
            });
        }
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
