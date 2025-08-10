import { Component, Input, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe, PercentPipe, KeyValuePipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { CampaignsApiService } from '../../core/services/campaigns.api';
import { ReportsApiService } from '../../core/services/reports.api';
import { Campaign, CampaignReport } from '../../core/models/models';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-campaign-monitor',
  standalone: true,
  imports: [
    CommonModule,
    KeyValuePipe,
    DecimalPipe,
    PercentPipe,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatTableModule,
    TranslateModule,
  ],
  styleUrls: ['./campaign-monitor.component.scss'],
  templateUrl: './campaign-monitor.component.html',
})
export class CampaignMonitorComponent implements OnDestroy {
  @Input() id!: string;

  private snack = inject(MatSnackBar);
  private campaignsApi = inject(CampaignsApiService);
  private reportsApi = inject(ReportsApiService);

  campaign = signal<Campaign | null>(null);
  report = signal<CampaignReport | null>(null);
  loading = signal<boolean>(false);
  lastRefresh = signal<Date | null>(null);

  private intervalId: any;

  logColumns = ['time', 'change', 'reason'];
  aiLogDemo = [
    { time: new Date().toLocaleString(), change: 'Zwiększono budżet Push o 10%', reason: 'Wzrost CTR o 12% w ostatnich 2h' },
    { time: new Date(Date.now() - 3600_000).toLocaleString(), change: 'Wariant B – korekta nagłówka Email', reason: 'Wyższy open-rate w segmencie A' },
  ];

  constructor() {
    // initial load and start auto-refresh
    this.refresh();
    this.intervalId = setInterval(() => this.refresh(), 15000);
  }

  ngOnDestroy(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  refresh() {
    if (!this.id) return;
    this.loading.set(true);

    this.campaignsApi.get(this.id).subscribe({
      next: (c) => this.campaign.set(c),
      error: () => this.campaign.set(null),
    });

    this.reportsApi.getCampaignReport(this.id).subscribe({
      next: (r) => {
        this.report.set(r);
        this.lastRefresh.set(new Date());
        this.loading.set(false);
      },
      error: () => {
        this.report.set({
          campaign_id: this.id,
          roi: 0,
          spend: 0,
          revenue: 0,
          ctr: {},
          conversions: 0,
          time_to_trend: { launched_days_before_peak: null },
          best_variant: null,
          insights: [],
        });
        this.lastRefresh.set(new Date());
        this.loading.set(false);
      }
    });
  }

  abVariantsToRender() {
    const c = this.campaign();
    if (!c) return [] as Array<{ channel: string; variant: string }>;
    const channels = c.channels || [];
    const variantsCount = Math.max(2, c.ab_variants || 2);
    const variantLabels = ['A', 'B', 'C', 'D'].slice(0, variantsCount);
    const list: Array<{ channel: string; variant: string }> = [];
    channels.forEach((ch) => variantLabels.forEach((v) => list.push({ channel: ch, variant: v })));
    return list;
  }

  onPause() { this.snack.open('Kampania wstrzymana (MVP).', 'OK', { duration: 2500 }); }
  onResume() { this.snack.open('Kampania wznowiona (MVP).', 'OK', { duration: 2500 }); }
  onBoostBudget() { this.snack.open('Budżet zwiększony o 20% (MVP).', 'OK', { duration: 2500 }); }
  setWinner(channel: string, variant: string) {
    this.snack.open(`Ustawiono zwycięzcę: ${channel.toUpperCase()} – ${variant} (MVP).`, 'OK', { duration: 2500 });
  }
}
