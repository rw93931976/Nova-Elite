/**
 * SOVEREIGN LIVE ENGINE v11.0 (Relay Mode)
 * ---------------------------------------
 * A "Thin Client" that connects to the Sovereign Node (VPS) instead of Google.
 * Enforces "Keyless" architecture where credentials never leave the server.
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
                const relayUrl = "wss://api.mysimpleaihelp.com:3506";
                console.log(`🛰️ [Relay] Handshaking with Sovereign Node: ${relayUrl}`);

                this.socket = new WebSocket(relayUrl);

                this.socket.onopen = () => {
                    console.log("✅ [Relay] Secure Pipe Established.");
                    // Send setup packet to trigger the VPS -> Google connection
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

                        // Handle native setup responses or tool calls
                        if (data.toolCall) {
                            await this.handleToolCall(data.toolCall);
                        } else if (data.serverContent?.modelTurn?.parts) {
                            const part = data.serverContent.modelTurn.parts[0];
                            if (part.inlineData) {
                                this.onAudioCallback?.(part.inlineData.data);
                            }
                        }
                    } catch (e) {
                        // Binary stream fallback if handled by the relay as fragments
                        if (event.data instanceof Blob) {
                            const reader = new FileReader();
                            reader.onload = () => {
                                const base64 = (reader.result as string).split(',')[1];
                                this.onAudioCallback?.(base64);
                            };
                            reader.readAsDataURL(event.data);
                        }
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

    /**
     * SEND AUDIO STREAM
     * Pipes raw PCM (base64) to the Relay.
     */
    public sendAudio(base64Chunk: string) {
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.send({
                realtimeInput: {
                    mediaChunks: [{
                        mimeType: "audio/pcm;rate=16000",
                        data: base64Chunk
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

    public isConnected(): boolean {
        return this.socket?.readyState === WebSocket.OPEN;
    }
}
