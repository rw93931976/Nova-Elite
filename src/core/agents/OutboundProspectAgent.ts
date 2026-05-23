import { supabase } from '../../integrations/supabase';
import { DiscoveryAgent } from './DiscoveryAgent';
import { OUTBOUND_PAIN_QUERIES } from '../sandbox/SandboxTenants';

export interface ProspectBrief {
  query: string;
  painSummary: string;
  companyHint: string;
  contactHint: string;
  emailDraft: string;
}

/**
 * Outbound prospect worker — pain search → company research → decision-maker → email draft.
 * Nothing sends until Ray approves (human-in-the-loop).
 */
export class OutboundProspectAgent {
  private discovery = new DiscoveryAgent();
  readonly role = 'outbound-prospect';

  async scanPainSignals(extraQuery?: string): Promise<string[]> {
    const queries = extraQuery ? [extraQuery, ...OUTBOUND_PAIN_QUERIES] : OUTBOUND_PAIN_QUERIES;
    const summaries: string[] = [];

    for (const query of queries.slice(0, 3)) {
      const hit = await this.discovery.search(query);
      if (hit) summaries.push(`QUERY: ${query}\n${hit}`);
    }

    return summaries;
  }

  async buildProspectBrief(companyName: string, painContext: string): Promise<ProspectBrief> {
    const research = await this.discovery.search(
      `${companyName} HVAC plumbing electrical owner manager contact about phone dispatch missed calls`,
    );
    const contactSearch = await this.discovery.search(
      `${companyName} owner president operations manager LinkedIn email`,
    );

    const emailDraft = composeEmail(companyName, painContext, research, contactSearch);

    return {
      query: companyName,
      painSummary: painContext.slice(0, 1500),
      companyHint: research.slice(0, 2000),
      contactHint: contactSearch.slice(0, 1000),
      emailDraft,
    };
  }

  async queueEmailForApproval(brief: ProspectBrief, tenantId: string): Promise<boolean> {
    const { error } = await supabase.from('nova_tasks').insert({
      title: `Outbound: ${brief.query} — email approve`,
      description: brief.emailDraft,
      status: 'pending',
      priority: 'high',
      metadata: {
        sandbox: true,
        tenant_id: tenantId,
        agent: this.role,
        action: 'outbound_email',
        company: brief.query,
        pain_summary: brief.painSummary,
        company_research: brief.companyHint,
        contact_research: brief.contactHint,
        assignee: 'ray',
        human_gate: true,
        reveal_on_call:
          'If they book: Ray explains the system researched, drafted, and queued this — no human until approval.',
      },
    });

    return !error;
  }
}

function composeEmail(
  company: string,
  pain: string,
  research: string,
  contact: string,
): string {
  const contactLine = contact.split('\n').find((l) => l.trim()) || 'there';

  return `Subject: Quick thought on ${company}'s phones / after-hours

Hi —

I noticed signals that ${company} may be dealing with missed calls or dispatch friction (${pain.slice(0, 200).trim()}…).

From what I can see publicly: ${research.slice(0, 400).trim()}…

We run an operator-grade voice + outreach stack for trades shops (1–15 techs). Happy to show a 15-minute walkthrough — no deck, just how it works on a real shop.

If useful, reply with a time this week.

— Ray

---
[SYSTEM NOTE — not in sent email]
Contact research: ${contactLine.slice(0, 300)}
Draft composed by Kate sandbox outbound agent. Ray approves before send.`;
}
