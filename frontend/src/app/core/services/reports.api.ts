import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CampaignReport } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ReportsApiService {
  constructor(private http: HttpClient) {}

  getCampaignReport(id: string): Observable<CampaignReport> {
    return this.http.get<CampaignReport>(`/reports/campaign/${encodeURIComponent(id)}`);
  }
}
