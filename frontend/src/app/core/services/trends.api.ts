import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TrendDetails, TrendMatch, TrendRecommendation } from '../models/models';

@Injectable({ providedIn: 'root' })
export class TrendsApiService {
  constructor(private http: HttpClient) {}

  getRecommendations(params: { lat: number; lng: number; radius_km: number; limit?: number }): Observable<TrendRecommendation[]> {
    let httpParams = new HttpParams()
      .set('lat', String(params.lat))
      .set('lng', String(params.lng))
      .set('radius_km', String(params.radius_km));
    if (typeof params.limit === 'number') {
      httpParams = httpParams.set('limit', String(params.limit));
    }
    return this.http.get<TrendRecommendation[]>(`/trends/recommendations`, { params: httpParams });
  }

  getMatches(trendId: string): Observable<TrendMatch[]> {
    return this.http.get<TrendMatch[]>(`/trends/${encodeURIComponent(trendId)}/matches`);
  }

  getDetails(trendId: string): Observable<TrendDetails> {
    return this.http.get<TrendDetails>(`/trends/${encodeURIComponent(trendId)}`);
  }
}
