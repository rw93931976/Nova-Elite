/**
 * LiveEngine: SOVEREIGN SDK RELAY CLIENT (v14.0)
 * --------------------------------------------
 * This client talks to the Managed SDK Relay on the VPS.
 * It no longer manages the Gemini handshake directly.
 */
export class LiveEngine {
    private socket: WebSocket | null = null;
    private onAudioCallback: ((chunk: string) => void) | null = null;
    private onProsodyCallback: ((data: any) => void) | null = null;
    private onToolCallCallback: ((name: string, args: any) => Promise<any>) | null = null;
    private onStateChange: ((state: 'connected' | 'disconnected' | 'error', msg?: string) => void) | null = null;
    private isSetupComplete: boolean = false;

    constructor() {
        console.log("🛰️ [LiveEngine] Initialization (SDK Relay Mode)");
    }

    public async connect(_systemInstruction: string) {
        if (this.socket) return;

        return new Promise<void>((resolve, reject) => {
            // SOVEREIGN SDK RELAY: Secure Dynamic Proxy
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const host = window.location.hostname === 'localhost' ? '31.220.59.237' : window.location.host;
            const relayUrl = `${protocol}//${host}/relay`;

            console.log(`📡 [Relay] Connecting to Managed SDK Engine: ${relayUrl}`);
            this.socket = new WebSocket(relayUrl);

            this.socket.onopen = () => {
                console.log(" [Relay] Linked to Managed SDK Engine");

                // SOVEREIGN: Trigger Remote Handshake immediately
                this.socket?.send(JSON.stringify({
                    type: 'setup',
                    setup: {
                        model: "models/gemini-2.0-flash-exp",
                        generation_config: {
                            response_modalities: ["audio"]
                        },
                        system_instruction: {
                            parts: [{ text: _systemInstruction }]
                        }
                    }
                }));

                this.onStateChange?.('connected');
                resolve();
            };

            this.socket.onmessage = async (event) => {
                try {
                    const data = JSON.parse(event.data);

                    // Handshake Completion from Server
                    if (data.setupComplete) {
                        console.log("✨ [Relay] Sovereign Handshake SUCCESS");
                        this.isSetupComplete = true;
                        return;
                    }

                    // Handle Audio/Text Content
                    const content = data.serverContent;
                    if (content?.modelTurn?.parts) {
                        for (const part of content.modelTurn.parts) {
                            if (part.inlineData) {
                                this.onAudioCallback?.(part.inlineData.data);
                            }
                        }
                    }

                    // Handle Error Messages from Relay
                    if (data.error) {
                        console.error("❌ [Relay] Engine Error:", data.error);
                    }
                } catch (error) {
                    // Ignore binary pulses if any
                }
            };

            this.socket.onerror = (error) => {
                console.error("❌ [Relay] Engine Connection Error:", error);
                this.onStateChange?.('error', 'SDK Relay Connection Failed');
                reject(error);
            };

            this.socket.onclose = (event) => {
                console.log(`🔌 [Relay] Connection Closed (Code: ${event.code})`);
                this.onStateChange?.('disconnected');
                this.socket = null;
                this.isSetupComplete = false;
            };
        });
    }

    public sendAudio(base64Data: string) {
        if (!this.isSetupComplete) {
            // Suppress until handshake is confirmed by VPS
            return;
        }
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                realtimeInput: {
                    audio: {
                        mimeType: "audio/pcm;rate=16000",
                        data: base64Data
                    }
                }
            }));
        }
    }

    public onAudio(callback: (chunk: string) => void) { this.onAudioCallback = callback; }
    public onToolCall(callback: (name: string, args: any) => Promise<any>) { this.onToolCallCallback = callback; }
    public onStatus(callback: (state: 'connected' | 'disconnected' | 'error', msg?: string) => void) { this.onStateChange = callback; }
    public disconnect() { if (this.socket) this.socket.close(); }
}
