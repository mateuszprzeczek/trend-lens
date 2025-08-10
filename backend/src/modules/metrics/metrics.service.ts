import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IngestMetricDto, MetricEventDtoEnum } from './dto/ingest-metric.dto';
import { MetricEvent } from '@prisma/client';

@Injectable()
export class MetricsService {
  constructor(private prisma: PrismaService) {}

  async ingest(dto: IngestMetricDto) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: dto.campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    // Validate event explicitly (DTO already restricts, but double-check)
    const eventUpper = String(dto.event || '').toUpperCase();
    const allowed: MetricEvent[] = ['IMPRESSION', 'OPEN', 'CLICK', 'CONVERSION'] as any;
    if (!allowed.includes(eventUpper as any)) {
      throw new BadRequestException('Invalid event');
    }
    const event: MetricEvent = eventUpper as MetricEvent;

    // Validate timestamp: must be ISO (DTO) and not further than now()+5m
    const tsDate = new Date(dto.ts);
    const now = new Date();
    const maxFuture = new Date(now.getTime() + 5 * 60 * 1000);
    if (tsDate.getTime() > maxFuture.getTime()) {
      throw new BadRequestException('ts cannot be more than 5 minutes in the future');
    }

    const metric = await this.prisma.metric.create({
      data: {
        campaignId: dto.campaignId,
        channel: dto.channel,
        variant: dto.variant ?? null,
        event,
        value: dto.value ?? 1,
        ts: tsDate,
      },
    });

    // Compute totals for campaign after insert
    const metrics = await this.prisma.metric.findMany({ where: { campaignId: dto.campaignId } });
    const totals = { impressions: 0, opens: 0, clicks: 0, conversions: 0 } as { impressions: number; opens: number; clicks: number; conversions: number };
    for (const m of metrics) {
      const val = m.value ?? 1;
      if (m.event === 'IMPRESSION') totals.impressions += val;
      if (m.event === 'OPEN') totals.opens += val;
      if (m.event === 'CLICK') totals.clicks += val;
      if (m.event === 'CONVERSION') totals.conversions += 1;
    }

    return { id: metric.id, totals };
  }
}
