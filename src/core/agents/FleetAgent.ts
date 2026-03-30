import { supabase } from '../../integrations/supabase';

export class FleetAgent {
    private nodeId: string;
    private peerCount: number = 0;

    constructor() {
        this.nodeId = `nova-node-${Math.random().toString(36).substring(7)}`;
    }

    /**
     * Stage 10: Fleet Heartbeat
     * Broadcasts this node's status and retrieves real peer counts.
     */
    public async broadcastHeartbeat(): Promise<void> {
        console.log(`📡 [FLEET]: Broadcasting Heartbeat for ${this.nodeId}`);

        try {
            // 1. Update self
            await supabase.from('nova_fleet_nodes').upsert([{
                node_id: this.nodeId,
                status: 'online',
                last_seen: new Date().toISOString(),
                metadata: { version: 'v4.4', autonomy: 10 }
            }]);

            // 2. Count active peers (online in last 5 minutes)
            const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
            const { count } = await supabase
                .from('nova_fleet_nodes')
                .select('*', { count: 'exact', head: true })
                .gt('last_seen', fiveMinsAgo);

            this.peerCount = (count || 1) - 1; // Subtract self
            console.log(`✅ [FLEET]: Heartbeat Success. Active Peers detected: ${this.peerCount}`);
        } catch (e) {
            console.warn('[FLEET] Heartbeat failed:', e);
        }
    }

    public getFleetStatus() {
        return {
            nodeId: this.nodeId,
            peerCount: this.peerCount,
            cluster: "SOVEREIGN_PRODUCTION",
            status: this.peerCount > 0 ? "Fleet Synchronized" : "Isolated Node"
        };
    }
}
