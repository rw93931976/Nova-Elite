export class SchoolingAgent {
    private bridgeUrl: string;
    private wisdom: Map<string, string> = new Map();
    private subjects: string[] = [
        "AEO & AI Search Mastery",
        "Social Media Authority: X, Pinterest, LinkedIn",
        "AI Social Media Posting & Content Rules",
        "Email Marketing & High-Grade Communication",
        "Customer Service Elite Protocols",
        "Top 1% Internet Business Architecture",
        "Advanced SEO (Legacy & Resilience)",
        "High-Ticket Copywriting Mastery",
        "Business Automation & Scalability",
        "Infrastructure Security & Sovereignty",
        "Sovereign Coding & Engineering",
        "Business Finance & Growth Metrics",
        "Leadership & Group Training Mastery"
    ];
    private currentSubjectIndex: number = 0;
    private curiositySubjects: string[] = [];
    private lastRotation: number = Date.now();
    // 🎓 SOVEREIGN ALIGNMENT (v8.3.2): 6-hour research intervals to match the Manifest
    private readonly ROTATION_INTERVAL = 6 * 60 * 60 * 1000;

    constructor(bridgeUrl: string) {
        this.bridgeUrl = bridgeUrl || '';
    }

    public async syncLessons(): Promise<number> {
        if (!this.bridgeUrl) return 0;
        try {
            const listRes = await fetch(`${this.bridgeUrl}/api/schooling/list`);
            const { files } = await listRes.json();

            let newLessons = 0;
            for (const file of files) {
                if (!this.wisdom.has(file)) {
                    const readRes = await fetch(`${this.bridgeUrl}/api/schooling/read?name=${file}`);
                    const data = await readRes.json();
                    if (data.content) {
                        this.wisdom.set(file, data.content);
                        newLessons++;
                    }
                }
            }
            return newLessons;
        } catch (e) {
            console.error('[Schooling] Sync failed:', e);
            return 0;
        }
    }

    public getWisdomContext(): string {
        this.checkRotation();
        const subject = this.getCurrentSubject();

        let context = `\n### CURRENT STUDY FOCUS: ${subject}\n`;
        if (this.wisdom.size > 0) {
            context += "### LEARNED BUSINESS RULES:\n";
            this.wisdom.forEach((content, name) => {
                context += `- [${name}]: ${content}\n`;
            });
        }
        return context;
    }

    private checkRotation() {
        const now = Date.now();
        if (now - this.lastRotation > this.ROTATION_INTERVAL) {
            this.currentSubjectIndex = (this.currentSubjectIndex + 1) % this.subjects.length;
            this.lastRotation = now;
            console.log(`[Schooling] Subject Rotated to: ${this.subjects[this.currentSubjectIndex]}`);
        }
    }

    public getCurrentSubject(): string {
        if (this.curiositySubjects.length > 0) {
            return `Curiosity Branch: ${this.curiositySubjects[0]}`;
        }
        return this.subjects[this.currentSubjectIndex];
    }

    public branchTopic(topic: string) {
        if (!this.curiositySubjects.includes(topic)) {
            this.curiositySubjects.unshift(topic); // Prioritize curiosity
            if (this.curiositySubjects.length > 5) this.curiositySubjects.pop();
            console.log(`[Schooling] Curiosity Triggered: Investigating ${topic}`);
        }
    }

    public completeBranch() {
        this.curiositySubjects.shift();
    }

    public clearWisdom() {
        this.wisdom.clear();
    }
}
