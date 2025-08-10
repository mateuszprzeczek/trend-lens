import { Component, Input, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe, PercentPipe, NgFor, NgIf, KeyValuePipe, DatePipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTableModule } from '@angular/material/table';
import { CampaignsApiService } from '../../core/services/campaigns.api';
import { ReportsApiService } from '../../core/services/reports.api';
import { Campaign, CampaignReport } from '../../core/models/models';

@Component({
  selector: 'app-campaign-monitor',
  standalone: true,
  imports: [
    CommonModule,
    NgIf,
    NgFor,
    KeyValuePipe,
    DecimalPipe,
    PercentPipe,
    DatePipe,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatTableModule,
  ],
  styles: [
    `
    :host { display:block; }
    .header { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom: 16px; }
    .actions { display:flex; gap:8px; flex-wrap: wrap; }
    .grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; }
    .muted { opacity:.8; font-size: 12px; }
    .variants { display:grid; gap:12px; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
    table { width: 100%; }
    `
  ],
  template: `
    <div class="header">
      <div>
        <h1 style="margin:0">Monitoring kampanii #{{ id }}</h1>
        <div class="muted">Ostatnie odświeżenie: {{ lastRefresh() ? (lastRefresh() | date:'HH:mm:ss') : '—' }}</div>
      </div>
      <div class="actions">
        <button mat-stroked-button color="warn" (click)="onPause()">
          <mat-icon>pause</mat-icon>
          Pauza
        </button>
        <button mat-stroked-button color="primary" (click)="onResume()">
          <mat-icon>play_arrow</mat-icon>
          Wznów
        </button>
        <button mat-flat-button color="accent" (click)="onBoostBudget()">
          <mat-icon>trending_up</mat-icon>
          +20% budżet
        </button>
      </div>
    </div>

    <!-- KPI section -->
    <div class="grid" style="margin-bottom: 16px;">
      <mat-card *ngFor="let entry of (report()?.ctr | keyvalue)" appearance="outlined">
        <mat-card-header>
          <mat-card-title>CTR – {{ entry.key }}</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <div style="font-size:24px; font-weight:600;">{{ entry.value | percent:'1.1-2' }}</div>
          <div class="muted">Klikalność dla kanału</div>
        </mat-card-content>
      </mat-card>

      <mat-card appearance="outlined">
        <mat-card-header><mat-card-title>CPC</mat-card-title></mat-card-header>
        <mat-card-content>
          <div style="font-size:24px; font-weight:600;">—</div>
          <div class="muted">Placeholder</div>
        </mat-card-content>
      </mat-card>

      <mat-card appearance="outlined">
        <mat-card-header><mat-card-title>Wydatki</mat-card-title></mat-card-header>
        <mat-card-content>
          <div style="font-size:24px; font-weight:600;">—</div>
          <div class="muted">Placeholder</div>
        </mat-card-content>
      </mat-card>

      <mat-card appearance="outlined">
        <mat-card-header><mat-card-title>Przychód</mat-card-title></mat-card-header>
        <mat-card-content>
          <div style="font-size:24px; font-weight:600;">{{ report()?.revenue | number:'1.0-0' }} PLN</div>
          <div class="muted">Z raportu</div>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- A/B section -->
    <mat-card style="margin-bottom: 16px;">
      <mat-card-header>
        <mat-card-title>A/B – warianty</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="variants">
          <mat-card *ngFor="let v of abVariantsToRender()" appearance="outlined">
            <mat-card-header>
              <mat-card-title>{{ v.channel | uppercase }} – wariant {{ v.variant }}</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="muted">CTR: — · Konwersje: —</div>
            </mat-card-content>
            <mat-card-actions>
              <button mat-button color="primary" (click)="setWinner(v.channel, v.variant)">
                <mat-icon>emoji_events</mat-icon>
                Ustaw zwycięzcę
              </button>
            </mat-card-actions>
          </mat-card>
        </div>
      </mat-card-content>
    </mat-card>

    <!-- AI change log demo -->
    <mat-card>
      <mat-card-header>
        <mat-card-title>Log zmian AI</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <table mat-table [dataSource]="aiLogDemo">
          <ng-container matColumnDef="time">
            <th mat-header-cell *matHeaderCellDef>Czas</th>
            <td mat-cell *matCellDef="let r">{{ r.time }}</td>
          </ng-container>
          <ng-container matColumnDef="change">
            <th mat-header-cell *matHeaderCellDef>Zmiana</th>
            <td mat-cell *matCellDef="let r">{{ r.change }}</td>
          </ng-container>
          <ng-container matColumnDef="reason">
            <th mat-header-cell *matHeaderCellDef>Powód</th>
            <td mat-cell *matCellDef="let r">{{ r.reason }}</td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="logColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: logColumns"></tr>
        </table>
        <div class="muted" *ngIf="!aiLogDemo.length">Brak wpisów (demo).</div>
      </mat-card-content>
    </mat-card>
  `,
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
