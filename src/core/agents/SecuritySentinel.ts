export class SecuritySentinel {
    private isRogueDetected: boolean = false;

    constructor() { }

    /**
     * NO-DELETE MANDATE:
     * This is the definitive safety gate. It forbids any deletion-style operations.
     */
    public verifyAction(action: string, detail: any): boolean {
        const forbiddenPatterns = [/delete/i, /unlink/i, /remove_file/i, /drop_table/i];
        const isForbidden = forbiddenPatterns.some(p => p.test(action));

        if (isForbidden) {
            console.error(`🚨 [SECURITY SENTINEL]: FORBIDDEN ACTION BLOCKED: ${action}`);
            this.isRogueDetected = true;
            return false;
        }

        return true;
    }

    public requiresApproval(action: string): boolean {
        const sensitivePatterns = [/capital/i, /finance/i, /root/i, /config/i, /gate/i, /reset/i];
        return sensitivePatterns.some(p => p.test(action));
    }

    /**
     * NETWORK DEFENSE (LEVEL 2/3):
     * Monitors for outside attacks (brute force, unauthorized gateway attempts).
     */
    public async monitorNetworkDefense(logs: any[]): Promise<{ status: string; threats: string[] }> {
        const threats: string[] = [];
        const unauthorizedAttempts = logs.filter(l => l.status === 401 || l.message?.includes('Unauthorized'));

        if (unauthorizedAttempts.length > 10) {
            threats.push("COGNITIVE_FIREWALL_ALERT: Multiple unauthorized gateway attempts detected.");
            this.isRogueDetected = true;
        }

        return {
            status: threats.length > 0 ? "Under Attack" : "Secure",
            threats
        };
    }

    public getStatus() {
        return {
            status: "active",
            integrity: 100,
            threatLevel: this.isRogueDetected ? "Elevated" : "Low",
            protocols: ["No-Delete [Active]", "Cognitive Firewall [Active]", "Oversight Gating [Active]"]
        };
    }
}
