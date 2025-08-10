import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { MetricEvent } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  private normChannel(ch: string): string {
    return (ch || '').toLowerCase();
  }

  async getCampaignReport(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException('Campaign not found');

    const metrics = await this.prisma.metric.findMany({ where: { campaignId } });

    type Agg = {
      impressions: number;
      opens: number;
      clicks: number;
      conversions: number;
      revenue: number;
      variants: Record<string, { impressions: number; opens: number; clicks: number }>;
      hoursClicks: number[]; // 0..23 clicks histogram for insights
    };

    const byChannel: Record<string, Agg> = {};

    for (const m of metrics) {
      const ch = this.normChannel(m.channel);
      if (!byChannel[ch]) {
        byChannel[ch] = { impressions: 0, opens: 0, clicks: 0, conversions: 0, revenue: 0, variants: {}, hoursClicks: new Array(24).fill(0) };
      }
      const agg = byChannel[ch];

      // counts
      if (m.event === 'IMPRESSION') agg.impressions += m.value ?? 1;
      if (m.event === 'OPEN') agg.opens += m.value ?? 1;
      if (m.event === 'CLICK') {
        const clicks = m.value ?? 1;
        agg.clicks += clicks;
        const hour = (m.ts ? new Date(m.ts) : new Date()).getHours();
        agg.hoursClicks[hour] = (agg.hoursClicks[hour] || 0) + clicks;
      }
      if (m.event === 'CONVERSION') {
        agg.conversions += 1;
        agg.revenue += m.value ?? 0;
      }

      // per-variant
      if (m.variant) {
        const v = m.variant;
        if (!agg.variants[v]) agg.variants[v] = { impressions: 0, opens: 0, clicks: 0 };
        if (m.event === 'IMPRESSION') agg.variants[v].impressions += m.value ?? 1;
        if (m.event === 'OPEN') agg.variants[v].opens += m.value ?? 1;
        if (m.event === 'CLICK') agg.variants[v].clicks += m.value ?? 1;
      }
    }

    // CTR per channel with rules
    const ctr: Record<string, number> = {};
    for (const [ch, a] of Object.entries(byChannel)) {
      let value = 0;
      if (ch === 'push') {
        value = a.impressions > 0 ? a.clicks / a.impressions : a.clicks / Math.max(a.opens, 1);
      } else if (ch === 'email') {
        value = a.opens > 0 ? a.clicks / a.opens : a.clicks / Math.max(a.impressions, 1);
      } else {
        // default fallback
        value = a.impressions > 0 ? a.clicks / a.impressions : 0;
      }
      ctr[ch] = Math.round(value * 1000) / 1000;
    }
    // Ensure channels from campaign are present with 0 if missing
    const channels = (campaign.channels as any as string[]) || [];
    for (const raw of channels) {
      const ch = this.normChannel(raw);
      if (ctr[ch] == null) ctr[ch] = 0;
    }

    // Spend placeholder: 0 for now
    const spend = 0;

    // Revenue: sum value of conversions
    const revenue = Object.values(byChannel).reduce((s, a) => s + (a.revenue || 0), 0);

    // Total conversions (all channels)
    const conversions = Object.values(byChannel).reduce((s, a) => s + a.conversions, 0);

    // ROI rule
    const roi = spend ? revenue / spend : revenue;

    // time_to_trend.launched_days_before_peak
    let launched_days_before_peak: number | null = null;
    if (campaign.trendId) {
      const trend = await this.prisma.trend.findUnique({ where: { id: campaign.trendId } });
      if (trend?.forecastPeakInDays != null && campaign.schedule) {
        const today = new Date();
        const peakDate = new Date(today);
        peakDate.setDate(today.getDate() + trend.forecastPeakInDays);
        const scheduleDate = new Date(campaign.schedule);
        const diffMs = peakDate.getTime() - scheduleDate.getTime();
        launched_days_before_peak = Math.round(diffMs / (1000 * 60 * 60 * 24));
      }
    }

    // best_variant by highest CTR across all channels
    let best_variant: { channel: string; variant: string } | null = null;
    let bestCtr = -1;
    for (const [ch, a] of Object.entries(byChannel)) {
      for (const [v, av] of Object.entries(a.variants)) {
        let vCtr = 0;
        if (ch === 'push') {
          vCtr = av.impressions > 0 ? av.clicks / av.impressions : av.clicks / Math.max(av.opens, 1);
        } else if (ch === 'email') {
          vCtr = av.opens > 0 ? av.clicks / av.opens : av.clicks / Math.max(av.impressions, 1);
        } else {
          vCtr = av.impressions > 0 ? av.clicks / av.impressions : 0;
        }
        if (vCtr > bestCtr) {
          bestCtr = vCtr;
          best_variant = { channel: ch, variant: v };
        }
      }
    }

    // Insights 2–4 simple rules
    const insights: string[] = [];
    if (Object.keys(ctr).length > 0) {
      const [topCh, topCtr] = Object.entries(ctr).sort((a, b) => b[1] - a[1])[0];
      insights.push(`Najwyższy CTR w ${topCh} (${topCtr})`);
    }
    if (ctr['email'] != null && ctr['push'] != null) {
      if (ctr['email'] > ctr['push'] * 1.1) insights.push('Email przewyższa CTR push (>10%)');
      else if (ctr['push'] > ctr['email'] * 1.1) insights.push('Push przewyższa CTR email (>10%)');
    }
    // best 2-hour window by clicks across all channels
    const totalHours = new Array(24).fill(0);
    for (const a of Object.values(byChannel)) a.hoursClicks.forEach((v, i) => (totalHours[i] += v));
    if (totalHours.some((v) => v > 0)) {
      let bestStart = 0;
      let bestSum = -1;
      for (let h = 0; h < 24; h++) {
        const sum = totalHours[h] + totalHours[(h + 1) % 24];
        if (sum > bestSum) {
          bestSum = sum;
          bestStart = h;
        }
      }
      insights.push(`Lepsze wyniki ${bestStart}:00–${((bestStart + 2) % 24).toString().padStart(2, '0')}:00`);
    }
    while (insights.length < 2) {
      insights.push(insights.length === 0 ? 'Zbieramy więcej danych, aby wygenerować wnioski.' : 'Zalecamy kontynuację testów A/B, aby poprawić CTR.');
    }

    return {
      campaign_id: campaignId,
      roi: Math.round(roi * 1000) / 1000,
      spend,
      revenue: Math.round(revenue * 100) / 100,
      ctr,
      conversions,
      time_to_trend: { launched_days_before_peak },
      best_variant,
      insights,
    };
  }
}
