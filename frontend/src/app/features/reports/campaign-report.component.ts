import { Component, Input, AfterViewInit, OnDestroy, ViewChild, ElementRef, DestroyRef, inject, signal, effect } from '@angular/core';
import { CommonModule, DecimalPipe, NgIf, NgFor } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { ReportsApiService } from '../../core/services/reports.api';
import { CampaignReport } from '../../core/models/models';
import { Chart } from 'chart.js/auto';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-campaign-report',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, DecimalPipe, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, TranslateModule],
  styles: [
    `
    :host { display:block; }
    .header { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom: 16px; }
    .grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; margin-bottom: 16px; }
    .muted { opacity:.8; font-size: 12px; }
    .badge-row { display:flex; gap:8px; align-items:center; margin-bottom: 12px; flex-wrap: wrap; }
    canvas { max-height: 280px; }
    `
  ],
  template: `
    <div class="header">
      <h1 style="margin:0">{{ 'report.title' | translate }} #{{ id }}</h1>
      <div>
        <button mat-stroked-button color="primary" (click)="exportPdf()">
          <mat-icon>picture_as_pdf</mat-icon>
          {{ 'report.export' | translate }}
        </button>
      </div>
    </div>

    <div class="badge-row">
      <mat-chip-set>
        <mat-chip *ngIf="report()?.time_to_trend?.launched_days_before_peak != null">
          {{ 'report.daysToPeak' | translate }}: {{ report()?.time_to_trend?.launched_days_before_peak }}
        </mat-chip>
        <mat-chip *ngIf="report()?.best_variant as bv">
          {{ 'report.bestCreative' | translate }}: {{ (bv.channel || '').toUpperCase() }} – {{ bv.variant }}
        </mat-chip>
      </mat-chip-set>
      <span class="muted" *ngIf="loading()">{{ 'home.loading' | translate }}</span>
    </div>
    <div class="grid">
      <mat-card appearance="outlined">
        <mat-card-header><mat-card-title>{{ 'report.roi' | translate }}</mat-card-title></mat-card-header>
        <mat-card-content>
          <div style="font-size:28px; font-weight:600;">{{ (report()?.roi ?? 0) * 100 | number:'1.0-0' }}%</div>
          <div class="muted">ROI</div>
        </mat-card-content>
      </mat-card>

      <mat-card appearance="outlined">
        <mat-card-header><mat-card-title>{{ 'report.spend' | translate }}</mat-card-title></mat-card-header>
        <mat-card-content>
          <div style="font-size:28px; font-weight:600;">{{ report()?.spend | number:'1.0-0' }} zł</div>
          <div class="muted">{{ 'report.spend' | translate }}</div>
        </mat-card-content>
      </mat-card>

      <mat-card appearance="outlined">
        <mat-card-header><mat-card-title>{{ 'report.revenue' | translate }}</mat-card-title></mat-card-header>
        <mat-card-content>
          <div style="font-size:28px; font-weight:600;">{{ report()?.revenue | number:'1.0-0' }} zł</div>
          <div class="muted">{{ 'report.revenue' | translate }}</div>
        </mat-card-content>
      </mat-card>
    </div>
    <mat-card style="margin-bottom: 16px;">
      <mat-card-header>
        <mat-card-title>CTR</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <canvas #ctrChart></canvas>
      </mat-card-content>
    </mat-card>
    <mat-card>
      <mat-card-header>
        <mat-card-title>{{ 'report.insights' | translate }}</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <mat-list *ngIf="(report()?.insights?.length || 0) > 0; else noInsights">
          <mat-list-item *ngFor="let i of report()?.insights">{{ i }}</mat-list-item>
        </mat-list>
        <ng-template #noInsights>
          <p class="muted">{{ 'report.noInsights' | translate }}</p>
        </ng-template>
      </mat-card-content>
    </mat-card>
  `,
})
export class CampaignReportComponent implements AfterViewInit, OnDestroy {
  @Input() id!: string;
  @ViewChild('ctrChart') ctrChartRef!: ElementRef<HTMLCanvasElement>;

  private api = inject(ReportsApiService);
  private destroyRef = inject(DestroyRef);

  report = signal<CampaignReport | null>(null);
  loading = signal<boolean>(false);

  private chart: Chart | null = null;

  constructor() {
    effect(() => {
      const rid = this.id;
      if (!rid) return;
      this.loading.set(true);
      this.api.getCampaignReport(rid).subscribe({
        next: (r) => {
          this.report.set(r);
          this.loading.set(false);
          this.updateChart();
        },
        error: () => {
          this.report.set({
            campaign_id: rid,
            roi: 0,
            spend: 0,
            revenue: 0,
            ctr: {},
            conversions: 0,
            time_to_trend: { launched_days_before_peak: null },
            best_variant: null,
            insights: [],
          });
          this.loading.set(false);
          this.updateChart();
        },
      });
    });

    this.destroyRef.onDestroy(() => this.ngOnDestroy());
  }

  ngAfterViewInit(): void {
    this.updateChart();
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  exportPdf() {
    window.print();
  }

  private updateChart() {
    if (!this.ctrChartRef) return;
    const r = this.report();
    const ctr = r?.ctr || {};
    const labels = Object.keys(ctr);
    const values = labels.map((k) => ctr[k] ?? 0);

    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    const ctx = this.ctrChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.length ? labels.map((l) => l.toUpperCase()) : ['—'],
        datasets: [
          {
            label: 'CTR',
            data: values.length ? values.map((v) => Math.round(v * 10000) / 100) : [0],
            backgroundColor: ['#90caf9', '#ffcc80', '#a5d6a7', '#ce93d8', '#80cbc4', '#f48fb1'],
          },
        ],
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `CTR: ${ctx.parsed.y}%`,
            },
          },
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            grid: { color: 'rgba(255,255,255,0.08)' },
            ticks: {
              callback: (val) => `${val}%`,
            },
            beginAtZero: true,
          },
        },
      },
    });
  }
}
