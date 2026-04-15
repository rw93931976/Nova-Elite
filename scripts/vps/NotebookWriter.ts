import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execPromise = promisify(exec);

interface NotebookEntry {
    subject: string;
    url: string;
    createdAt: string;
}

export class NotebookWriter {
    private readonly REGISTRY_PATH = 'nova-data/notebook_registry.json';
    private readonly SKILL_PATH = 'C:/Users/Ray/.gemini/antigravity/skills/notebooklm';

    constructor() {
        if (!fs.existsSync('nova-data')) {
            fs.mkdirSync('nova-data');
        }
        if (!fs.existsSync(this.REGISTRY_PATH)) {
            fs.writeFileSync(this.REGISTRY_PATH, JSON.stringify([], null, 2));
        }
    }

    private getRegistry(): NotebookEntry[] {
        return JSON.parse(fs.readFileSync(this.REGISTRY_PATH, 'utf8'));
    }

    private saveToRegistry(entry: NotebookEntry) {
        const registry = this.getRegistry();
        registry.push(entry);
        fs.writeFileSync(this.REGISTRY_PATH, JSON.stringify(registry, null, 2));
    }

    /**
     * Ensures a notebook exists for a specific subject.
     * If not found in registry, it creates a new one in NotebookLM.
     */
    public async ensureSubjectNotebook(subject: string): Promise<string | null> {
        const registry = this.getRegistry();
        const existing = registry.find(e => e.subject.toLowerCase() === subject.toLowerCase());

        if (existing) {
            console.log(`📂 [NotebookWriter] Found existing notebook for: ${subject}`);
            return existing.url;
        }

        console.log(`➕ [NotebookWriter] Creating new notebook for subject: ${subject}...`);
        try {
            // Using the run.py wrapper as required by the skill
            const command = `python ${this.SKILL_PATH}/scripts/run.py ${this.SKILL_PATH}/scripts/create_notebook.py --name "${subject}"`;
            const { stdout } = await execPromise(command);

            const match = stdout.match(/SUCCESS_URL:\s*(https:\/\/notebooklm\.google\.com\/notebook\/[a-zA-Z0-9-]+)/);
            if (match && match[1]) {
                const url = match[1];
                this.saveToRegistry({
                    subject,
                    url,
                    createdAt: new Date().toISOString()
                });
                return url;
            }
            throw new Error(`Failed to extract URL from create_notebook output: ${stdout}`);
        } catch (error) {
            console.error(`❌ [NotebookWriter] Error creating notebook for ${subject}:`, error);
            return null;
        }
    }

    /**
     * Archives research content to a specific subject notebook.
     */
    public async archive(subject: string, content: string): Promise<boolean> {
        const url = await this.ensureSubjectNotebook(subject);
        if (!url) return false;

        console.log(`📝 [NotebookWriter] Archiving content to ${subject} notebook...`);
        try {
            // Using add_source.py via the run.py wrapper
            // Note: We escape double quotes in content for the shell
            const escapedContent = content.replace(/"/g, '\\"');
            const command = `python ${this.SKILL_PATH}/scripts/run.py ${this.SKILL_PATH}/scripts/add_source.py --notebook-url "${url}" --content "${escapedContent}"`;

            await execPromise(command);
            console.log(`✅ [NotebookWriter] Archival complete for: ${subject}`);
            return true;
        } catch (error) {
            console.error(`❌ [NotebookWriter] Archival failure for ${subject}:`, error);
            return false;
        }
    }
}
