import { AgentFactory } from '../agents/AgentFactory';
import { ContentArchitectAgent } from '../agents/ContentArchitectAgent';
import { OutboundProspectAgent } from '../agents/OutboundProspectAgent';
import type { NovaCore } from '../NovaCore';
import {
  getSandboxTenant,
  SANDBOX_TRAINING_TENANTS,
  type SandboxTenant,
} from './SandboxTenants';

export interface TenantWorkerPair {
  tenant: SandboxTenant;
  contentArchitect: ContentArchitectAgent;
  outboundProspect: OutboundProspectAgent;
}

/**
 * Kate enters sandbox → spawns one worker pair per training tenant.
 * Human gates stay on all outbound posts and emails.
 */
export class SandboxOrchestrator {
  constructor(private core: NovaCore) {}

  isEnabled(): boolean {
    return Boolean(this.core.sandboxModeEnabled);
  }

  spawnTrainingFleet(): TenantWorkerPair[] {
    if (!this.isEnabled()) {
      console.warn('[Sandbox] KATE_SANDBOX_MODE off — fleet spawn blocked.');
      return [];
    }

    AgentFactory.enableSandboxRoles();

    return SANDBOX_TRAINING_TENANTS.map((tenant) => ({
      tenant,
      contentArchitect: AgentFactory.spawn('content-architect', this.core, tenant) as ContentArchitectAgent,
      outboundProspect: AgentFactory.spawn('outbound-prospect', this.core) as OutboundProspectAgent,
    }));
  }

  async runTrainingPulse(sourceContentByTenant?: Record<string, string>): Promise<string> {
    const fleet = this.spawnTrainingFleet();
    if (fleet.length === 0) {
      return 'Sandbox disabled. Set KATE_SANDBOX_MODE=1 (or VITE_KATE_SANDBOX_MODE=1 in PWA).';
    }

    const lines: string[] = ['### SANDBOX TRAINING PULSE'];

    for (const { tenant, contentArchitect, outboundProspect } of fleet) {
      const source =
        sourceContentByTenant?.[tenant.id] ??
        `Weekly pulse for ${tenant.displayName}. ${tenant.offerSummary}`;

      const drafts = await contentArchitect.proposePosts(source, 3);
      const queuedPosts = await contentArchitect.queueDraftsForApproval(drafts);

      const pains = await outboundProspect.scanPainSignals(
        'HVAC plumbing small business owner frustrated missed calls',
      );
      const painBlob = pains.join('\n\n') || 'No Tavily hits — check API key on runner.';
      const brief = await outboundProspect.buildProspectBrief(
        `Example ${tenant.displayName} ICP prospect`,
        painBlob,
      );
      const queuedEmail = await outboundProspect.queueEmailForApproval(brief, tenant.id);

      lines.push(
        `- ${tenant.displayName}: ${queuedPosts} post drafts queued, outbound email ${queuedEmail ? 'queued' : 'failed'}.`,
      );
    }

    lines.push('Human gate: approve tasks in Control Room / nova_tasks before anything sends.');
    return lines.join('\n');
  }

  spawnForTenant(tenantId: string): TenantWorkerPair | null {
    const tenant = getSandboxTenant(tenantId);
    if (!tenant || !this.isEnabled()) return null;

    AgentFactory.enableSandboxRoles();
    return {
      tenant,
      contentArchitect: AgentFactory.spawn('content-architect', this.core, tenant) as ContentArchitectAgent,
      outboundProspect: AgentFactory.spawn('outbound-prospect', this.core) as OutboundProspectAgent,
    };
  }
}
