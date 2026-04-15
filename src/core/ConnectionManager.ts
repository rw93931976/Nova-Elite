/**
 * ConnectionManager - Robust WebSocket management with exponential backoff.
 * Prevents the "Console Flood" observed in the previous version.
 */
export class ConnectionManager {
    private ws: WebSocket | null = null;
    private url: string;
    private name: string;
    private reconnectAttempts: number = 0;
    private maxReconnectAttempts: number = 10;
    private reconnectDelay: number = 1000; // Starting delay 1s
    private onMessage: (data: any) => void;
    private onStatusChange: (status: 'online' | 'offline' | 'connecting') => void;

    constructor(name: string, url: string, onMessage: (data: any) => void, onStatusChange: (status: 'online' | 'offline' | 'connecting') => void) {
        this.name = name;
        this.url = url;
        this.onMessage = onMessage;
        this.onStatusChange = onStatusChange;
    }

    public connect() {
        if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
            return;
        }

        console.log(`🔌 [${this.name}] Connecting to ${this.url}...`);
        this.onStatusChange('connecting');

        try {
            this.ws = new WebSocket(this.url);

            this.ws.onopen = () => {
                console.log(`✅ [${this.name}] Online`);
                this.reconnectAttempts = 0;
                this.reconnectDelay = 1000;
                this.onStatusChange('online');

                // Wakeup message
                this.send({ type: 'wakeup', from: 'nova', timestamp: Date.now() });
            };

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.onMessage(data);
                } catch (error) {
                    console.error(`❌ [${this.name}] Message Parse Error:`, error);
                }
            };

            this.ws.onclose = () => {
                console.log(`⚠️ [${this.name}] Stream Disconnected (Silent)`);
                // this.onStatusChange('offline'); // SILENCED: Let HTTP Heartbeat drive status
                this.handleReconnect();
            };

            this.ws.onerror = (error) => {
                console.error(`🚨 [${this.name}] Stream Error:`, error);
                // this.onStatusChange('offline'); // SILENCED
            };

        } catch (error) {
            console.error(`🚨 [${this.name}] Setup Error:`, error);
            this.handleReconnect();
        }
    }

    private handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log(`❌ [${this.name}] Max reconnect attempts reached. Standing down.`);
            return;
        }

        this.reconnectAttempts++;
        console.log(`🔄 [${this.name}] Reconnecting in ${this.reconnectDelay}ms (Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            this.reconnectDelay = Math.min(this.reconnectDelay * 2, 30000); // Max 30s delay
            this.connect();
        }, this.reconnectDelay);
    }

    public send(data: any) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
            return true;
        }
        return false;
    }

    public disconnect() {
        if (this.ws) {
            this.ws.onclose = null; // Prevent reconnect loop
            this.ws.close();
            this.ws = null;
        }
    }
}
