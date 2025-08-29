import { HttpEvent, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { mockTrendsRecommendations, mockTrendMatches, mockTrendDetails } from '../mock/trends.mock';
import { mockCampaignGenerate, mockCampaignGet, mockCampaignLaunch } from '../mock/campaigns.mock';
import { mockCampaignReport } from '../mock/reports.mock';

function normalizeUrl(url: string): string {
  try {
    const u = url || '';
    const a = u.replace(/^https?:\/\/[^/]+/i, '');
    return a.startsWith('/api') ? a.substring(4) : a;
  } catch {
    return url || '';
  }
}

export const demoInterceptor: HttpInterceptorFn = (req, next) => {
  const url = normalizeUrl(req.url);
  const method = (req.method || 'GET').toUpperCase();

  if (!(url.startsWith('/trends') || url.startsWith('/campaigns') || url.startsWith('/reports'))) {
    return next(req);
  }

  let body: any = null;
  let status = 200;

  try {
    if (method === 'GET' && url.startsWith('/trends/recommendations')) {
      const qp = new URLSearchParams(url.split('?')[1] || '');
      const lat = parseFloat(qp.get('lat') || '50.0647');
      const lng = parseFloat(qp.get('lng') || '19.945');
      const radius_km = parseFloat(qp.get('radius_km') || '200');
      const limit = parseInt(qp.get('limit') || '6', 10);
      body = mockTrendsRecommendations({ lat, lng, radius_km, limit });
    } else if (method === 'GET' && /^\/trends\/[A-Za-z0-9%.-]+(\?|$)/.test(url)) {
      const m = url.match(/^\/trends\/([^/?#]+)/);
      const id = m?.[1] || '123';
      body = mockTrendDetails(decodeURIComponent(id));
    } else if (method === 'GET' && /^\/trends\/.+\/matches(\?|$)/.test(url)) {
      const m = url.match(/^\/trends\/([^/?#]+)\/matches/);
      const id = m?.[1] || '123';
      body = mockTrendMatches(id);
    }
    else if (method === 'POST' && url === '/campaigns/generate') {
      const payload = (req.body || { trend_id: '123', products: [], channels: ['push', 'email'] }) as Parameters<typeof mockCampaignGenerate>[0];
      body = mockCampaignGenerate(payload);
    } else if (method === 'POST' && url === '/campaigns/launch') {
      const payload = (req.body || { campaign_id: 'demo-camp-1' }) as Parameters<typeof mockCampaignLaunch>[0];
      body = mockCampaignLaunch(payload);
    } else if (method === 'GET' && /^\/campaigns\//.test(url)) {
      const id = decodeURIComponent(url.split('/')[2] || 'demo-camp-1');
      body = mockCampaignGet(id);
    }
    else if (method === 'GET' && /^\/reports\/campaign\//.test(url)) {
      const id = decodeURIComponent(url.split('/')[3] || 'demo-camp-1');
      body = mockCampaignReport(id);
    }
  } catch (e) {
    status = 500;
    body = { error: 'Mock error', message: String(e) };
  }

  if (body === null) {
    return next(req);
  }

  const resp = new HttpResponse({ status, body });
  const latency = 200 + Math.floor(Math.random() * 300);
  return of(resp).pipe(delay(latency)) as unknown as Observable<HttpEvent<any>>;
};
