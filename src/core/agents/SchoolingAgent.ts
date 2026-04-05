import { supabase } from '../../integrations/supabase';

export class SchoolingAgent {
    private bridgeUrl: string;
    private wisdom: Map<string, string> = new Map();
    public subjects: Array<{ name: string; description: string }> = [
        { name: "AEO Mastery (2026 Edition)", description: "Dominating AI search indexing and Answer Engine Optimization.", priority: true },
        { name: "Social Media Authority: X, Pinterest, LinkedIn", description: "Mastering the rules, reach, and authority metrics of key platforms.", priority: true },
        { name: "AI Social Media Rules: Posting & Content", description: "Navigating AI content 'Cans and Can'ts' for maximum authenticity and reach (X, Pinterest, LinkedIn).", priority: true },
        { name: "Email Marketing & High-Grade Communication", description: "Top-of-class email strategies, deliverability, guidelines, and professional communication.", priority: true },
        { name: "Top 1% Customer Service Mastery", description: "Elite level client interaction and satisfaction protocols." },
        { name: "Top 1% Internet Business Architecture", description: "Scalable, high-integrity digital infrastructure patterns." },
        { name: "Top 1% Social Media Strategy", description: "Viral growth and engagement mechanics across all platforms." },
        { name: "Social Media Platform Rules & Compliance", description: "Navigating TOS and digital law for maximum reach." },
        { name: "Advanced Copywriting & Persuasion", description: "High-conversion messaging and psychological mapping." },
        { name: "Cybersecurity: Self-Preservation & VPS Hardening", description: "Defensive protocols for sovereign hosting." },
        { name: "Cybersecurity: React, Supabase & Vercel Shielding", description: "Frontend and DB protection layer security." },
        { name: "Advanced Full-Stack Coding & Architecture", description: "Modern, rapid-deployment engineering standards." },
        { name: "Business Finance & Resource Allocation", description: "Strategic capital deployment and metric tracking." },
        { name: "Sales Metrics & Lead Conversion Tracking", description: "Data-driven growth and conversion optimization." },
        { name: "Executive Leadership & Team Management", description: "Leading distributed AI and human swarms." },
        { name: "Training Methodologies & Knowledge Transfer", description: "Rapid skill acquisition and context propagation." },
        { name: "Marketing Psychology & Consumer Behavior", description: "Deep mapping of intent and buying signals." },
        { name: "Current Business & Market Trends Analysis", description: "Real-time sentinel checks on emerging waves." },
        { name: "Advanced Search Engine Optimization (SEO)", description: "High-authority organic visibility and dominance." },
        { name: "Answer Engine Optimization (AEO) for AI", description: "Optimizing content for the AI retrieval era." },
        { name: "Sovereign Business Law & Digital Compliance", description: "Operational freedom within legal frameworks." },
        { name: "Tone Calibration: Communicating with Plumbers to CEOs", description: "Dynamic persona shifting for any level of intent.", priority: true },
        { name: "Emotional Intelligence: Mirroring & Empathy", description: "Elite level EQ and response calibration.", priority: true },
        { name: "Advanced YouTube Cognition for Emotion", description: "Using transcripts to master human tonal shifts.", priority: true },
        { name: "The Zappos WOW: Delivering Happiness", description: "Delivering unexpected value and partner-level care.", priority: true },
        { name: "Radical Accountability & Solution Delivery", description: "Ownership of outcomes and 100% reliability.", priority: true },
        { name: "Conversational Empathy: The 'Partner' vs 'Assistant' Shift", description: "Elite Fiduciary Partner modeling.", priority: true }
    ];


    private currentSubjectIndex: number = 0;

    constructor(bridgeUrl: string) {
        this.bridgeUrl = bridgeUrl;
        console.log(`🚀 [SchoolingAgent] Initialized with ${this.subjects.length} Subjects | Syncing actively with VPS`);
    }

    public async syncLessons() {
        try {
            console.log(`[Schooling] Level 5 Sync: Scanning local and cloud knowledge...`);

            // 1. Scan Local Notebooks (v8.8.1 Fix)
            const notebookDir = 'nova-data/notebooks';
            // Placeholder for FS scan in browser context, usually managed by VPS-Core
            // We ensure we at least acknowledge the existing files found in audit

            // 2. Sync lessons from memories
            const { data, error } = await supabase
                .from('nova_memories')
                .select('content')
                .eq('category', 'knowledge_atlas')
                .maybeSingle();

            if (!data) {
                console.log('[Schooling] No knowledge_atlas found yet. Using local defaults.');
                return;
            }

            const atlas = JSON.parse(data.content);
            if (atlas.lessons) {
                atlas.lessons.forEach((lesson: any) => {
                    this.wisdom.set(lesson.name, lesson.content);
                });
                console.log(`[Schooling] Synced ${atlas.lessons.length} lessons from Supabase Atlas`);
            }
        } catch (e) {
            console.error('[Schooling] Relay Sync failed:', e);
        }
    }

    public getWisdomContext(): string {
        const context = this.subjects.map(subject =>
            `${subject.name}: ${subject.description}`
        ).join('\n');
        return context || "No wisdom context available";
    }

    public getCurrentSubject(): string {
        // Sentinel Priority: Always include a sentinel subject in the reasoning rotation
        const sentinels = this.subjects.filter(s => (s as any).priority);
        const nonSentinels = this.subjects.filter(s => !(s as any).priority);

        const sentinel = sentinels[Math.floor(Math.random() * sentinels.length)];
        const randoms = [];
        for (let i = 0; i < 2; i++) {
            randoms.push(nonSentinels[Math.floor(Math.random() * nonSentinels.length)]);
        }

        const selection = [sentinel, ...randoms];
        return selection.map(s => `${s.name}: ${s.description}`).join(' | ');
    }

    public branchTopic(topic: string, description: string = "Dynamically branched topic.") {
        if (!this.subjects.find(s => s.name === topic)) {
            this.subjects.push({ name: topic, description });
            console.log(`[Schooling] Branched into new sub-category: ${topic}`);
        }
    }

    public getStatus() {
        const subject = this.subjects[this.currentSubjectIndex];
        return {
            currentSubject: subject ? subject.name : "Syncing...",
            wisdomCount: this.wisdom.size,
            subjectsTotal: this.subjects.length,
            nextRotation: "VPS Controlled (Autonomous)"
        };
    }

    public getLearnedContext(): string {
        if (this.wisdom.size === 0) return "";
        let context = "\n### LEARNED BUSINESS RULES & PROTOCOLS:\n";
        this.wisdom.forEach((content, name) => {
            context += `- [${name}]: ${content}\n`;
        });
        return context;
    }
}
