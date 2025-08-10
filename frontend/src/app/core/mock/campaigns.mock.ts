import { Campaign, CampaignAssets } from '../models/models';

function buildAssets(): CampaignAssets {
  return {
    push: {
      title: 'Nowy trend – sprawdź teraz! 💡',
      body: 'Skorzystaj z fali popularności i zwiększ sprzedaż dzięki naszej ofercie.',
      cta_url: 'https://example.com/promo',
      icon_url: 'https://via.placeholder.com/64'
    },
    email: {
      subject: 'Trend rośnie – przygotowaliśmy propozycję kampanii',
      html: '<h2>Nowy trend</h2><p>Wykorzystaj go z naszymi kreacjami.</p>',
      alt_text: 'Nowy trend – kampania'
    }
  };
}

export function mockCampaignGenerate(body: { trend_id: string; products: string[]; channels: string[]; brand_preferences?: any }): Campaign {
  return {
    id: 'demo-camp-1',
    trend_id: body.trend_id,
    channels: (body.channels || ['push', 'email']) as any,
    status: 'draft',
    schedule: new Date(Date.now() + 3600_000).toISOString(),
    budgets: { push: 500, email: 1000 },
    assets: buildAssets(),
    ab_variants: 2,
  };
}

export function mockCampaignGet(id: string): Campaign {
  return {
    id: id || 'demo-camp-1',
    trend_id: '123',
    channels: ['push', 'email'],
    status: 'running',
    schedule: new Date(Date.now() - 7200_000).toISOString(),
    budgets: { push: 600, email: 1200 },
    assets: buildAssets(),
    ab_variants: 2,
  };
}

export function mockCampaignLaunch(_: { campaign_id: string; schedule?: string; budgets?: Record<string, number>; audiences?: any }) {
  return { ok: true as const };
}
