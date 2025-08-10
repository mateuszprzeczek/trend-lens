import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MetricEvent, Prisma } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getCampaignReport(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    const metrics = await this.prisma.metric.findMany({ where: { campaignId } });

    // Aggregate
    const byChannel: Record<string, { impressions: number; clicks: number; conversions: number; byVariant: Record<string, number> }> = {};
    let conversionsValue = 0;
    for (const m of metrics) {
      const ch = m.channel;
      if (!byChannel[ch]) byChannel[ch] = { impressions: 0, clicks: 0, conversions: 0, byVariant: {} };
      // by variant clicks
      if (m.variant) {
        const map = byChannel[ch].byVariant;
        if (!map[m.variant]) map[m.variant] = 0;
        if (m.event === 'CLICK' || m.event === MetricEvent.CLICK) {
          map[m.variant] += m.value ?? 1;
        }
      }
      // counts
      if (m.event === 'IMPRESSION' || m.event === MetricEvent.IMPRESSION) byChannel[ch].impressions += m.value ?? 1;
      if (m.event === 'CLICK' || m.event === MetricEvent.CLICK) byChannel[ch].clicks += m.value ?? 1;
      if (m.event === 'CONVERSION' || m.event === MetricEvent.CONVERSION) {
        byChannel[ch].conversions += 1;
        conversionsValue += m.value ?? 0;
      }
    }

    // CTR per channel
    const ctr: Record<string, number> = {};
    for (const [ch, agg] of Object.entries(byChannel)) {
      const val = agg.impressions > 0 ? agg.clicks / agg.impressions : 0;
      ctr[ch] = Math.round(val * 1000) / 1000;
    }

    // Spend: sum of budgets numbers
    const budgets = (campaign.budgets as Prisma.JsonObject | null) || {};
    let spend = 0;
    for (const v of Object.values(budgets)) {
      const num = typeof v === 'number' ? v : 0;
      spend += num;
    }

    const revenue = Math.round((conversionsValue || 0) * 100) / 100;
    const conversions = metrics.filter((m) => m.event === 'CONVERSION' || m.event === MetricEvent.CONVERSION).length;
    const roi = spend > 0 ? revenue / spend : 0;

    // Best variant across all channels by clicks
    let best = { channel: '', variant: '' };
    let bestClicks = -1;
    for (const [ch, agg] of Object.entries(byChannel)) {
      for (const [v, clicks] of Object.entries(agg.byVariant)) {
        if (clicks > bestClicks) {
          bestClicks = clicks;
          best = { channel: ch, variant: v };
        }
      }
    }

    // time to trend (stub: if trend exists, compute days_before_peak as forecastPeakInDays)
    const trend = await this.prisma.trend.findUnique({ where: { id: campaign.trendId } });
    const launched_days_before_peak = trend?.forecastPeakInDays ?? 0;

    const insights = [
      'Kanał z najwyższym CTR: ' + (Object.entries(ctr).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'brak'),
    ];

    return {
      campaignId,
      roi: Math.round(roi * 1000) / 1000,
      spend,
      revenue,
      ctr,
      conversions,
      time_to_trend: { launched_days_before_peak },
      best_variant: bestClicks >= 0 ? best : null,
      insights,
    };
  }
}
