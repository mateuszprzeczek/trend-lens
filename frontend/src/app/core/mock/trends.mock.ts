import { TrendDetails, TrendMatch, TrendRecommendation } from '../models/models';

export function mockTrendsRecommendations(params: { lat: number; lng: number; radius_km: number; limit?: number }): TrendRecommendation[] {
  const limit = params.limit ?? 6;
  const sourcesTemplates: Array<Record<string, number>> = [
    { google: 50, tiktok: 30, twitter: 20 },
    { google: 20, tiktok: 60, twitter: 20 },
    { google: 30, tiktok: 20, twitter: 50 },
    { google: 40, tiktok: 40, twitter: 20 },
    { google: 25, tiktok: 25, twitter: 50 },
    { google: 10, tiktok: 70, twitter: 20 },
  ];
  const list: TrendRecommendation[] = [];
  for (let i = 0; i < limit; i++) {
    const id = `${100 + i}`;
    list.push({
      id,
      name: `Trend ${id}`,
      score: Math.round((70 + Math.random() * 30) * 100) / 100,
      growth_7d: Math.round((0.05 + Math.random() * 0.35) * 100) / 100,
      forecast_peak_in_days: Math.random() > 0.3 ? Math.floor(Math.random() * 21) + 3 : undefined,
      sources: sourcesTemplates[i % sourcesTemplates.length],
      explanations: [
        'Wzrost zapytań w Google Trends',
        'Wzmianki na TikTok rosną tydzień do tygodnia',
        'Pozytywne sentymenty w social media',
      ],
    });
  }
  return list;
}

export function mockTrendMatches(trendId: string): TrendMatch[] {
  const products = ['P-1001', 'P-1002', 'P-1003', 'P-1004', 'P-1005', 'P-1006'];
  return products.map((pid, idx) => ({
    product_id: pid,
    match_score: Math.round((0.6 + Math.random() * 0.4) * 100) / 100,
    profit_score: Math.round((0.5 + Math.random() * 0.5) * 100) / 100,
    reasons: [
      `Dopasowanie do grupy docelowej trendu #${trendId}`,
      idx % 2 === 0 ? 'Sezonowość wspiera sprzedaż' : 'Wysoki popyt w regionie',
    ],
  }));
}

export function mockTrendDetails(trendId: string): TrendDetails {
  const sources = ['google', 'tiktok', 'twitter'];
  const days = 14;
  const today = new Date();
  const timeline: TrendDetails['sources_timeline'] = [];
  for (let d = days - 1; d >= 0; d--) {
    const date = new Date(today);
    date.setDate(today.getDate() - d);
    const dateStr = date.toISOString().substring(0, 10);
    sources.forEach((s, idx) => {
      const base = 20 + idx * 10;
      const mentions = Math.max(0, Math.round(base + Math.sin((days - d) / 2 + idx) * 8 + Math.random() * 6));
      timeline.push({ date: dateStr, mentions, source: s });
    });
  }
  return {
    id: trendId,
    name: `Trend ${trendId}`,
    explanations: [
      'Wzrost zapytań w Google Trends',
      'Wzmianki na TikTok rosną tydzień do tygodnia',
      'Pozytywne sentymenty w social media',
    ],
    sources_timeline: timeline,
  };
}
