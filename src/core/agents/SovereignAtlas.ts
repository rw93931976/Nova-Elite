import { supabase } from '../../integrations/supabase';

export interface SkillMap {
    name: string;
    description: string;
    category: string;
    status: 'active' | 'discovery';
}

export class SovereignAtlas {
    private core: any;
    private knownSkills: SkillMap[] = [
        { name: 'Firebase Deployer', description: 'Automates safe Firebase Hosting deployments.', category: 'Deployment', status: 'active' },
        { name: 'Git Kickstart', description: 'Initializes git repo and ignores stack files.', category: 'DevOps', status: 'active' },
        { name: 'Compliance Guard', description: 'Checks for HIPAA/GDPR and legal disclaimers.', category: 'Compliance', status: 'active' },
        { name: 'NotebookLM Query', description: 'Direct query access to Google NotebookLM.', category: 'Knowledge', status: 'active' },
        { name: 'Document Auditor', description: 'Structural audit of docx files.', category: 'Admin', status: 'active' },
    ];

    constructor(core: any) {
        this.core = core;
    }

    /**
     * getSystemMap: Provides Nova with a high-level view of her environment.
     * This is the 'Atlas' that prevents redundant tool creation.
     */
    public async getSystemMap(): Promise<string> {
        const [toolsRes, schoolingRes] = await Promise.all([
            supabase.from('sovereign_tool_registry').select('*').eq('status', 'active'),
            supabase.from('nova_memories')
                .select('content, metadata, created_at')
                .eq('category', 'doctoral_research')
                .order('created_at', { ascending: false })
                .limit(1)
        ]);

        const tools = toolsRes.data;
        const schooling = schoolingRes.data;

        let report = "### 🛸 SOVEREIGN ATLAS: SYSTEM AWARENESS v9.1\n";
        report += "- ROLES: RAY (User), ANTIGRAVITY (Architect), NOVA (Assistant).\n";

        // 🎓 SCHOOLING GROUNDING (v9.1-SOVEREIGN)
        if (schooling && schooling[0]) {
            const lastTime = schooling[0].metadata?.timestamp || new Date(schooling[0].created_at).toLocaleString();
            report += `- LAST AUTONOMOUS SCHOOLING: ${lastTime}\n`;
            report += `- LATEST RESEARCH SUMMARY: ${schooling[0].content.substring(0, 150)}...\n`;
        } else {
            report += `- LAST AUTONOMOUS SCHOOLING: No recent records found in primary memory.\n`;
        }

        report += `- Total Native Skills Indexed: ~2,000 (Via MCP/Local Folder)\n`;
        report += `- Active Shovels (Custom): ${tools?.length || 0}\n\n`;

        report += "#### ACTIVE CAPABILITIES:\n";
        this.knownSkills.forEach(s => {
            report += `- [${s.category}] ${s.name}: ${s.description}\n`;
        });

        if (tools && tools.length > 0) {
            report += "\n#### CUSTOM SHOVELS:\n";
            tools.forEach(t => {
                report += `- ${t.name} (Owned by: ${t.owner_agent_id})\n`;
            });
        }

        report += "\n#### DIRECTIVES: \n- Use existing skills before proposing new 'Shovels'.\n- If a new tool is required, delegate to the 'ToolCreationAgent'.";

        return report;
    }

    public async scanFolders(): Promise<string[]> {
        // Logic to scan c:\Users\Ray\.gemini\antigravity\skills\ for new potential agents
        return ["document_auditor", "firebase_deploy", "git_kickstart", "compliance_guard"];
    }
}
