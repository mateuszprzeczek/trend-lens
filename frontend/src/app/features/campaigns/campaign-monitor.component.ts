import { Component, Input, OnDestroy, effect, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe, PercentPipe, KeyValuePipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { MatProgressBarModule } from '@angular/material/progress-bar';
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
    MatProgressBarModule,
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

  logColumns = ['time', 'change', 'reason'];
  aiLogDemo = [
    { time: new Date().toLocaleString(), change: 'Zwiększono budżet Push o 10%', reason: 'Wzrost CTR o 12% w ostatnich 2h' },
    { time: new Date(Date.now() - 3600_000).toLocaleString(), change: 'Wariant B – korekta nagłówka Email', reason: 'Wyższy open-rate w segmencie A' },
  ];

  // Set up auto-refresh bound to id with cleanup using effect
  private autoRefreshEffect = effect((onCleanup) => {
    const cid = this.id;
    if (!cid) return;
    this.refresh();
    const handle = setInterval(() => this.refresh(), 15000);
    onCleanup(() => clearInterval(handle));
  });

  ngOnDestroy(): void {
    // no-op; effect cleanup will clear the interval
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

  // Mock metrics for A/B variants
  getVariantCtr(channel: string, variant: string): number {
    const base = this.report()?.ctr?.[channel] ?? 0.03;
    const tweak = variant === 'A' ? 1.0 : variant === 'B' ? 0.97 : variant === 'C' ? 1.03 : 0.95;
    return Math.max(0, base * tweak);
  }

  getVariantConversions(channel: string, variant: string): number {
    const total = this.report()?.conversions ?? 0;
    // Distribute conversions evenly across channels and variants (simple mock)
    const channels = this.campaign()?.channels?.length || 1;
    const variants = Math.max(2, this.campaign()?.ab_variants || 2);
    const base = Math.floor(total / (channels * variants));
    // Small deterministic bump for A variant
    return base + (variant === 'A' ? 5 : 0);
  }

  onPause() {
    this.snack.open('Kampania wstrzymana (MVP).', 'OK', { duration: 2500 });
    const c = this.campaign();
    if (c) this.campaign.set({ ...c, status: 'paused' });
  }
  onResume() {
    this.snack.open('Kampania wznowiona (MVP).', 'OK', { duration: 2500 });
    const c = this.campaign();
    if (c) this.campaign.set({ ...c, status: 'running' });
  }
  onBoostBudget() {
    this.snack.open('Budżet zwiększony o 20% (MVP).', 'OK', { duration: 2500 });
    const c = this.campaign();
    if (c && c.budgets) {
      const updated: Record<string, number> = {};
      Object.entries(c.budgets).forEach(([k, v]) => {
        const num = typeof v === 'number' ? v : 0;
        updated[k] = Math.round(num * 1.2);
      });
      this.campaign.set({ ...c, budgets: updated });
    }
  }
  setWinner(channel: string, variant: string) {
    this.snack.open(`Ustawiono zwycięzcę: ${channel.toUpperCase()} – ${variant} (MVP).`, 'OK', { duration: 2500 });
  }
}
