import { Component, Input, AfterViewInit, OnDestroy, ViewChild, ElementRef, DestroyRef, inject, signal, effect } from '@angular/core';
import { CommonModule, DecimalPipe, NgIf, NgFor } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { ReportsApiService } from '../../core/services/reports.api';
import { CampaignReport } from '../../core/models/models';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-campaign-report',
  standalone: true,
  imports: [CommonModule, NgIf, NgFor, DecimalPipe, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule],
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
      <h1 style="margin:0">Raport kampanii #{{ id }}</h1>
      <div>
        <button mat-stroked-button color="primary" (click)="exportPdf()">
          <mat-icon>picture_as_pdf</mat-icon>
          Eksport PDF
        </button>
      </div>
    </div>

    <div class="badge-row">
      <mat-chip-set>
        <mat-chip *ngIf="report()?.time_to_trend?.launched_days_before_peak != null">
          Dni przed pikiem: {{ report()?.time_to_trend?.launched_days_before_peak }}
        </mat-chip>
        <mat-chip *ngIf="report()?.best_variant as bv">
          Best Creative: {{ (bv.channel || '').toUpperCase() }} – {{ bv.variant }}
        </mat-chip>
      </mat-chip-set>
      <span class="muted" *ngIf="loading()">Ładowanie raportu...</span>
    </div>

    <!-- Stat cards -->
    <div class="grid">
      <mat-card appearance="outlined">
        <mat-card-header><mat-card-title>ROI</mat-card-title></mat-card-header>
        <mat-card-content>
          <div style="font-size:28px; font-weight:600;">{{ report()?.roi | number:'1.2-2' }}x</div>
          <div class="muted">Zwrot z inwestycji</div>
        </mat-card-content>
      </mat-card>

      <mat-card appearance="outlined">
        <mat-card-header><mat-card-title>Wydatki (Spend)</mat-card-title></mat-card-header>
        <mat-card-content>
          <div style="font-size:28px; font-weight:600;">{{ report()?.spend | number:'1.0-0' }} PLN</div>
          <div class="muted">Całkowity koszt</div>
        </mat-card-content>
      </mat-card>

      <mat-card appearance="outlined">
        <mat-card-header><mat-card-title>Przychód (Revenue)</mat-card-title></mat-card-header>
        <mat-card-content>
          <div style="font-size:28px; font-weight:600;">{{ report()?.revenue | number:'1.0-0' }} PLN</div>
          <div class="muted">Przychód z kampanii</div>
        </mat-card-content>
      </mat-card>
    </div>

    <!-- CTR per channel chart -->
    <mat-card style="margin-bottom: 16px;">
      <mat-card-header>
        <mat-card-title>CTR per kanał</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <canvas #ctrChart></canvas>
      </mat-card-content>
    </mat-card>

    <!-- Insights list -->
    <mat-card>
      <mat-card-header>
        <mat-card-title>Insights</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <ul *ngIf="(report()?.insights?.length || 0) > 0; else noInsights">
          <li *ngFor="let i of report()?.insights">{{ i }}</li>
        </ul>
        <ng-template #noInsights>
          <p class="muted">Brak insightów.</p>
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
    // Load report when id is set
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
          // Fallback empty report to render UI gracefully
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

    // Ensure chart is destroyed when component is destroyed
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
    // If view not ready yet
    if (!this.ctrChartRef) return;
    const r = this.report();
    const ctr = r?.ctr || {};
    const labels = Object.keys(ctr);
    const values = labels.map((k) => ctr[k] ?? 0);

    // Destroy existing chart if any
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    // If no data, render an empty chart with placeholder labels
    const ctx = this.ctrChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels.length ? labels.map((l) => l.toUpperCase()) : ['—'],
        datasets: [
          {
            label: 'CTR',
            data: values.length ? values.map((v) => Math.round(v * 10000) / 100) : [0], // percent values
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
