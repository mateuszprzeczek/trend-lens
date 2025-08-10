export interface Company {
    id: string; name: string;
    geo_center: { lat: number; lng: number };
    radius_km: number; language: string;
    brand_kit?: { primary: string; secondary: string; tone: string; logo_url?: string };
}
export interface TrendRecommendation {
    id: string; name: string; score: number; growth_7d: number;
    forecast_peak_in_days?: number;
    sources: Record<string, number>;
    explanations: Array<string>;
}
export interface TrendMatch {
    product_id: string; match_score: number; profit_score: number; reasons: Array<string>;
}
export interface CampaignAssetPush { title: string; body: string; icon_url?: string; cta_url: string; }
export interface CampaignAssetEmail { subject: string; html: string; alt_text?: string; }
export interface CampaignAssets { push?: CampaignAssetPush; email?: CampaignAssetEmail; }
export interface Campaign {
    id: string; trend_id: string;
    channels: Array<'push'|'email'|'meta'|'gads'>;
    status: 'draft'|'scheduled'|'running'|'paused'|'finished';
    schedule?: string; budgets?: Record<string, number>;
    assets?: CampaignAssets; ab_variants: number;
}
export interface CampaignReport {
    campaign_id: string; roi: number; spend: number; revenue: number;
    ctr: Record<string, number>; conversions: number;
    time_to_trend: { launched_days_before_peak: number|null };
    best_variant: { channel: string; variant: string } | null;
    insights: Array<string>;
}
