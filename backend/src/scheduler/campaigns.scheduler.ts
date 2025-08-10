import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CampaignStatus, Prisma } from '@prisma/client';

@Injectable()
export class CampaignsScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CampaignsScheduler.name);
  private tickTimer: NodeJS.Timeout | null = null;
  private autotuneTimer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    // Run soon after boot to catch immediate past schedules
    this.safeTick();
    // Every 60 seconds
    this.tickTimer = setInterval(() => this.safeTick(), 60 * 1000);

    // Autotune hourly
    this.autotuneTimer = setInterval(() => this.safeAutotune(), 60 * 60 * 1000);
  }

  onModuleDestroy() {
    if (this.tickTimer) clearInterval(this.tickTimer);
    if (this.autotuneTimer) clearInterval(this.autotuneTimer);
  }

  private async safeTick() {
    try {
      await this.campaignsTick();
    } catch (e) {
      this.logger.error('campaigns:tick failed', e as any);
    }
  }

  private async safeAutotune() {
    try {
      await this.campaignsAutotune();
    } catch (e) {
      this.logger.error('campaigns:autotune failed', e as any);
    }
  }

  // Job: campaigns:tick — every minute
  private async campaignsTick() {
    if (this.running) return; // prevent overlapping
    this.running = true;
    try {
      const now = new Date();
      // Find all eligible campaigns first to create per-campaign audit entries
      const due = await this.prisma.campaign.findMany({
        where: {
          status: CampaignStatus.SCHEDULED,
          schedule: { lte: now },
        },
        select: { id: true, companyId: true },
      });
      if (due.length === 0) {
        return;
      }

      const ids = due.map((c) => c.id);
      await this.prisma.$transaction([
        // Update statuses
        this.prisma.campaign.updateMany({ where: { id: { in: ids } }, data: { status: CampaignStatus.RUNNING } }),
        // Create audit logs per campaign
        (this.prisma as any).auditLog.createMany({
          data: due.map((c) => ({
            companyId: c.companyId,
            entity: 'CAMPAIGN',
            entityId: c.id,
            action: 'CAMPAIGN:STARTED',
            details: { reason: 'schedule<=now' } as any,
          })),
        }),
      ]);

      this.logger.log(`campaigns:tick promoted ${due.length} campaign(s) to RUNNING`);
    } finally {
      this.running = false;
    }
  }

  // Job: campaigns:autotune — every hour
  private async campaignsAutotune() {
    const running = await this.prisma.campaign.findMany({
      where: { status: CampaignStatus.RUNNING },
      select: { id: true, companyId: true },
      take: 1000, // safety limit
    });
    if (running.length === 0) return;

    await (this.prisma as any).auditLog.createMany({
      data: running.map((c) => ({
        companyId: c.companyId,
        entity: 'CAMPAIGN',
        entityId: c.id,
        action: 'AUTOTUNE: noop (MVP)',
        details: { note: 'placeholder autotune step' } as any,
      })),
    });
    this.logger.log(`campaigns:autotune wrote ${running.length} noop audit entries`);
  }
}
