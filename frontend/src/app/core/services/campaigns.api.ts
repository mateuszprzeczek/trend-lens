import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Campaign } from '../models/models';

@Injectable({ providedIn: 'root' })
export class CampaignsApiService {
  constructor(private http: HttpClient) {}

  generate(body: { trend_id: string; products: string[]; channels: string[]; brand_preferences?: any }): Observable<Campaign> {
    return this.http.post<Campaign>(`/campaigns/generate`, body);
  }

  launch(body: { campaign_id: string; schedule?: string; budgets?: Record<string, number>; audiences?: any }): Observable<{ ok: true }> {
    return this.http.post<{ ok: true }>(`/campaigns/launch`, body);
  }

  get(id: string): Observable<Campaign> {
    return this.http.get<Campaign>(`/campaigns/${encodeURIComponent(id)}`);
  }
}
