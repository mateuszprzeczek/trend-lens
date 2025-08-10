import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IngestMetricDto } from './dto/ingest-metric.dto';
import { MetricEvent } from '@prisma/client';

@Injectable()
export class MetricsService {
  constructor(private prisma: PrismaService) {}

  async ingest(dto: IngestMetricDto) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: dto.campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    const eventUpper = (dto.event || '').toUpperCase();
    const allowed: MetricEvent[] = ['IMPRESSION', 'OPEN', 'CLICK', 'CONVERSION'] as any;
    const event: MetricEvent = (allowed.includes(eventUpper as any) ? eventUpper : 'CLICK') as MetricEvent;

    const metric = await this.prisma.metric.create({
      data: {
        campaignId: dto.campaignId,
        channel: dto.channel,
        variant: dto.variant ?? null,
        event,
        value: dto.value ?? 1,
        ts: new Date(dto.ts),
      },
    });
    return { id: metric.id };
  }
}
