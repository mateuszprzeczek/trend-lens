import { CampaignReport } from '../models/models';

export function mockCampaignReport(id: string): CampaignReport {
  return {
    campaign_id: id || 'demo-camp-1',
    roi: Math.round((1.4 + Math.random() * 2.2) * 100) / 100,
    spend: 2500 + Math.floor(Math.random() * 3500),
    revenue: 10000 + Math.floor(Math.random() * 15000),
    ctr: {
      push: 0.042 + Math.random() * 0.02,
      email: 0.085 + Math.random() * 0.03,
    },
    conversions: 120 + Math.floor(Math.random() * 150),
    time_to_trend: { launched_days_before_peak: Math.floor(Math.random() * 6) + 1 },
    best_variant: { channel: Math.random() > 0.5 ? 'push' : 'email', variant: Math.random() > 0.5 ? 'A' : 'B' },
    insights: [
      'Najlepsze wyniki w segmencie 25-34',
      'Wysyłka email w godzinach 9-11 zwiększa open-rate',
      'Push z krótszym tytułem poprawił CTR'
    ],
  };
}
