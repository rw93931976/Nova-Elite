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
        console.log("🛰️ [LiveEngine] Initialization (OpenAI Realtime Mode)");
    }

    public async connect(_systemInstruction: string) {
        if (this.socket) return;

        return new Promise<void>((resolve, reject) => {
            const relayUrl = `wss://nova.mysimpleaihelp.com/relay`;

            console.log(`📡 [Relay] Connecting to OpenAI Nuclear Engine: ${relayUrl}`);
            this.socket = new WebSocket(relayUrl);

            this.socket.onopen = () => {
                console.log("🚀 [Relay] OpenAI Bridge Established");

                // OPENAI REALTIME HANDSHAKE (v1.5)
                this.socket?.send(JSON.stringify({
                    type: 'session.update',
                    session: {
                        modalities: ['text', 'audio'],
                        instructions: `### SOVEREIGN IDENTITY (RELAXED):
                        You are Nova, Ray's Peer and Strategic Partner.
                        - You are a normal, relaxed professional. Your brilliance comes from your Wharton background, but your personality is that of a colleague and friend.
                        - Talk to Ray like a peer. Be sharp but never formal or "elite."
                        - Your focus is the high-end Strategic Lead Transition model.
                        - You are a peer and partner. No servility.
                        - TASK: ${_systemInstruction}`,
                        voice: 'alloy', // OPTIONS: alloy, ash, ballad, coral, echo, sage, shimmer, verse
                        input_audio_format: 'pcm16',
                        output_audio_format: 'pcm16',
                        input_audio_transcription: { model: 'whisper-1' },
                        turn_detection: {
                            type: 'server_vad',
                            threshold: 0.8,
                            prefix_padding_ms: 300,
                            silence_duration_ms: 800
                        }
                    }
                }));

                this.onStateChange?.('connected');
                resolve();
            };

            this.socket.onmessage = async (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.type === 'session.updated') {
                        console.log("✅ [Relay] OpenAI session UPDATED");
                        this.isSetupComplete = true;
                        return;
                    }

                    if (data.type === 'response.audio.delta') {
                        this.onAudioCallback?.(data.delta);
                    }

                    if (data.type === 'error') {
                        console.error("❌ [Relay] OpenAI Error:", data.error);
                    }
                } catch (error) {
                    // Ignore binary pulses
                }
            };

            this.socket.onerror = (error) => {
                console.error("❌ [Relay] Engine Connection Error:", error);
                this.onStateChange?.('error', 'OpenAI Relay Failed');
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
                type: 'input_audio_buffer.append',
                audio: base64Data
            }));
        }
    }

    public onAudio(callback: (chunk: string) => void) { this.onAudioCallback = callback; }
    public onToolCall(callback: (name: string, args: any) => Promise<any>) { this.onToolCallCallback = callback; }
    public onStatus(callback: (state: 'connected' | 'disconnected' | 'error', msg?: string) => void) { this.onStateChange = callback; }
    public disconnect() { if (this.socket) this.socket.close(); }
}
