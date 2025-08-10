import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, CampaignStatus, AuditEntity } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { GenerateCampaignDto } from './dto/generate-campaign.dto';
import { LaunchCampaignDto } from './dto/launch-campaign.dto';

@Injectable()
export class CampaignsService {
  constructor(private prisma: PrismaService) {}

  private async resolveCompanyId(companyId?: string): Promise<string | undefined> {
    if (companyId) return companyId;
    const first = await this.prisma.company.findFirst();
    return first?.id;
  }

  async generate(body: GenerateCampaignDto, companyId?: string) {
    const resolvedCompanyId = await this.resolveCompanyId(companyId);
    if (!resolvedCompanyId) throw new NotFoundException('Company not found');

    const trend = await this.prisma.trend.findUnique({ where: { id: body.trendId } });
    if (!trend) throw new NotFoundException('Trend not found');

    // Fake assets generation
    const abVariants = 2;
    const assets = {
      copies: [
        { variant: 'A', channel: 'push', text: `🔥 ${trend.name} — zobacz teraz!` },
        { variant: 'B', channel: 'push', text: `Nowy hit: ${trend.name}. Sprawdź!` },
        { variant: 'A', channel: 'email', subject: `${trend.name}: inspiracje`, body: 'Poznaj szczegóły trendu i ofertę.' },
        { variant: 'B', channel: 'email', subject: `Trendy: ${trend.name}`, body: 'Sprawdź, jak możesz skorzystać.' },
      ],
      images: [
        { variant: 'A', url: 'https://dummyimage.com/600x400/0e7490/ffffff&text=Variant+A' },
        { variant: 'B', url: 'https://dummyimage.com/600x400/65a30d/ffffff&text=Variant+B' },
      ],
      products: body.products,
      brandPreferences: body.brandPreferences ?? {},
    } as Prisma.JsonObject;

    const campaign = await this.prisma.campaign.create({
      data: {
        companyId: resolvedCompanyId,
        trendId: trend.id,
        status: CampaignStatus.DRAFT,
        schedule: null,
        channels: body.channels as string[],
        budgets: {},
        abVariants,
        assets,
      },
    });

    // Audit log: CAMPAIGN:GENERATE
    await (this.prisma as any).auditLog.create({
      data: {
        companyId: resolvedCompanyId,
        entity: AuditEntity.CAMPAIGN,
        entityId: campaign.id,
        action: 'CAMPAIGN:GENERATE',
        details: {
          trendId: trend.id,
          products: body.products,
          channels: body.channels,
          abVariants,
        } as Prisma.JsonObject,
      },
    });

    return { campaignId: campaign.id, assets, abVariants };
  }

  async launch(body: LaunchCampaignDto, companyId?: string) {
    const resolvedCompanyId = await this.resolveCompanyId(companyId);
    if (!resolvedCompanyId) throw new NotFoundException('Company not found');

    const campaign = await this.prisma.campaign.findUnique({ where: { id: body.campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    const scheduleDate = new Date(body.schedule);
    const now = new Date();
    const status = scheduleDate > now ? CampaignStatus.SCHEDULED : CampaignStatus.RUNNING;

    const updated = await this.prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        schedule: scheduleDate,
        status,
        budgets: (body.budgets ?? {}) as Prisma.JsonObject,
        // audiences are not in schema, but we can include in assets meta for now
        assets: this.mergeAssetsAudience(campaign.assets as Prisma.JsonObject | null, body.audiences ?? {}),
      },
    });

    // Audit log: CAMPAIGN:LAUNCH
    await (this.prisma as any).auditLog.create({
      data: {
        companyId: resolvedCompanyId,
        entity: AuditEntity.CAMPAIGN,
        entityId: updated.id,
        action: 'CAMPAIGN:LAUNCH',
        details: {
          schedule: scheduleDate.toISOString(),
          budgets: body.budgets ?? {},
          audiences: body.audiences ?? {},
          status,
        } as Prisma.JsonObject,
      },
    });

    return { campaignId: updated.id, status: updated.status, schedule: updated.schedule };
  }

  private mergeAssetsAudience(assets: Prisma.JsonObject | null, audiences: Record<string, string[]>): Prisma.JsonObject {
    const current = (assets as any) || {};
    const next = { ...current, audiences };
    return next as Prisma.JsonObject;
  }
}
