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
        console.log("🛰️ [LiveEngine] Initialization (Gemini Live Mode)");
    }

    public async connect(_systemInstruction: string) {
        if (this.socket) return;

        return new Promise<void>((resolve, reject) => {
            const relayUrl = `wss://nova.mysimpleaihelp.com/relay`;

            console.log(`📡 [Relay] Connecting to Gemini Live Relay: ${relayUrl}`);
            this.socket = new WebSocket(relayUrl);

            this.socket.onopen = () => {
                console.log("🚀 [Relay] Gemini Bridge Established");

                // GEMINI LIVE HANDSHAKE
                // Note: We intentionally keep this minimal; the relay/VPS owns provider credentials.
                this.socket?.send(JSON.stringify({
                    setup: {
                        model: "models/gemini-2.0-flash-exp",
                        generationConfig: {
                            responseModalities: ["AUDIO"]
                        },
                        systemInstruction: {
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

                    // Gemini ready signal (some relays may pass-through true setupComplete,
                    // others may synthesize it for the browser).
                    if (data.setupComplete !== undefined) {
                        console.log("✅ [Relay] Gemini setup COMPLETE");
                        this.isSetupComplete = true;
                        return;
                    }

                    // Gemini audio chunks typically arrive as inlineData parts within serverContent.modelTurn.parts.
                    // We forward the base64 payload to useLiveVoice for PCM playback.
                    const parts = data?.serverContent?.modelTurn?.parts;
                    if (Array.isArray(parts)) {
                        for (const p of parts) {
                            const inline = p?.inlineData;
                            if (inline?.data && typeof inline.data === 'string') {
                                this.onAudioCallback?.(inline.data);
                            }
                        }
                    }

                    if (data.type === 'error' || data.error) {
                        console.error("❌ [Relay] Gemini Relay Error:", data.error || data);
                    }
                } catch (error) {
                    // Ignore binary pulses
                }
            };

            this.socket.onerror = (error) => {
                console.error("❌ [Relay] Engine Connection Error:", error);
                this.onStateChange?.('error', 'Gemini Relay Failed');
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
        if (!this.isSetupComplete) return;

        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                realtimeInput: {
                    audio: {
                        data: base64Data,
                        mimeType: "audio/pcm;rate=24000"
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
