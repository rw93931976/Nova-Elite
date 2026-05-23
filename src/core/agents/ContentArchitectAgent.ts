import { supabase } from '../../integrations/supabase';
import type { SandboxPlatform, SandboxTenant } from '../sandbox/SandboxTenants';

export interface ContentDraft {
  platform: SandboxPlatform;
  type: string;
  text: string;
  tenantId: string;
}

/**
 * Content Architect — sandbox worker for X, Pinterest, LinkedIn drafts.
 * All publishes queue for Ray human-in-the-loop approval.
 */
export class ContentArchitectAgent {
  readonly role = 'content-architect';

  constructor(private tenant: SandboxTenant) {}

  async proposePosts(sourceContent: string, count = 6): Promise<ContentDraft[]> {
    const platformHint = this.tenant.platforms.join(', ');
    const seeded = `
TENANT: ${this.tenant.displayName}
PURPOSE: ${this.tenant.purpose}
VOICE: ${this.tenant.voiceNotes}
OFFER: ${this.tenant.offerSummary}
PLATFORMS (only these): ${platformHint}
SOURCE:
${sourceContent.slice(0, 4000)}
`;

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY;
    let assets: { platform?: string; type?: string; text?: string }[] = [];

    if (apiKey) {
      assets = await cascadeViaFetch(apiKey, seeded, count);
    }

    if (assets.length === 0) {
      assets = this.tenant.platforms.map((platform) => ({
        platform,
        type: 'educational',
        text: `[${this.tenant.displayName}] Draft — add OPENAI_API_KEY for full cascade.`,
      }));
    }

    return assets
      .filter((a) => a.text)
      .map((a) => ({
        platform: normalizePlatform(String(a.platform || this.tenant.platforms[0])),
        type: a.type || 'post',
        text: a.text!,
        tenantId: this.tenant.id,
      }));
  }

  async queueDraftsForApproval(drafts: ContentDraft[]): Promise<number> {
    let queued = 0;
    for (const draft of drafts) {
      const { error } = await supabase.from('nova_tasks').insert({
        title: `[${this.tenant.displayName}] ${draft.platform} post — approve`,
        description: draft.text,
        status: 'pending',
        priority: 'medium',
        metadata: {
          sandbox: true,
          tenant_id: this.tenant.id,
          agent: this.role,
          action: 'post_draft',
          platform: draft.platform,
          post_type: draft.type,
          assignee: 'ray',
          human_gate: true,
        },
      });
      if (!error) queued++;
    }
    return queued;
  }
}

async function cascadeViaFetch(
  apiKey: string,
  sourceContent: string,
  targetCount: number,
): Promise<{ platform?: string; type?: string; text?: string }[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: `Generate ${targetCount} unique social drafts. Return JSON: { "assets": [{ "platform": "x|pinterest|linkedin", "type": "hook|story|educational", "text": "..." }] }`,
          },
          { role: 'user', content: sourceContent },
        ],
      }),
    });
    if (!response.ok) return [];
    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || '{}';
    const parsed = JSON.parse(raw);
    return parsed.assets || [];
  } catch {
    return [];
  }
}

function normalizePlatform(raw: string): SandboxPlatform {
  const lower = raw.toLowerCase();
  if (lower.includes('linkedin')) return 'linkedin';
  if (lower.includes('pinterest')) return 'pinterest';
  if (lower.includes('twitter') || lower === 'x' || lower.includes(' x ')) return 'x';
  return 'x';
}
