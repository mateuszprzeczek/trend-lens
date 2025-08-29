import { AfterViewInit, Component, DestroyRef, Input, OnDestroy, ViewChild, ElementRef, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { TrendsApiService } from '../../core/services/trends.api';
import { TrendDetails, TrendMatch } from '../../core/models/models';
import { Chart } from 'chart.js/auto';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-trend-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatChipsModule, MatListModule, MatProgressSpinnerModule, MatProgressBarModule, TranslateModule],
  styleUrls: ['./trend-detail.component.scss'],
  templateUrl: './trend-detail.component.html',
})
export class TrendDetailComponent implements AfterViewInit, OnDestroy {
  @Input() id!: string;
  @ViewChild('momentumChart') momentumChartRef!: ElementRef<HTMLCanvasElement>;

  private api = inject(TrendsApiService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  matches = signal<TrendMatch[] | null>(null);
  loadingMatches = signal<boolean>(false);
  explanations = signal<string[]>([]);
  selected = signal<string[]>([]);
  details = signal<TrendDetails | null>(null);
  loadingDetails = signal<boolean>(false);

  displayedColumns = ['product', 'match', 'profit', 'reasons', 'actions'];

  private chart: Chart | null = null;

  constructor() {
    effect(() => {
      const trendId = this.id;
      if (!trendId) return;

      this.loadingMatches.set(true);
      this.api.getMatches(trendId).subscribe({
        next: (data) => { this.matches.set(data); this.loadingMatches.set(false); },
        error: () => { this.matches.set([]); this.loadingMatches.set(false); },
      });

      this.loadingDetails.set(true);
      this.api.getDetails(trendId).subscribe({
        next: (d) => {
          this.details.set(d);
          this.explanations.set(d.explanations || []);
          this.loadingDetails.set(false);
          this.updateChart();
        },
        error: () => {
          this.details.set(null);
          this.explanations.set([]);
          this.loadingDetails.set(false);
          this.updateChart();
        }
      });
    });
  }

  ngAfterViewInit(): void {
    this.updateChart();
    this.destroyRef.onDestroy(() => this.ngOnDestroy());
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  private updateChart() {
    if (!this.momentumChartRef) return;
    const det = this.details();

    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }

    const ctx = this.momentumChartRef.nativeElement.getContext('2d');
    if (!ctx) return;

    const timeline = det?.sources_timeline || [];
    if (!timeline.length) {
      this.chart = new Chart(ctx, {
        type: 'line',
        data: { labels: ['—'], datasets: [] },
        options: { responsive: true, plugins: { legend: { display: false } } }
      });
      return;
    }

    const dateSet = Array.from(new Set(timeline.map(t => t.date))).sort();
    const labels = dateSet.map(d => this.formatDdMm(d));

    const sources = Array.from(new Set(timeline.map(t => t.source)));
    const colorPalette = ['#90caf9', '#ffcc80', '#a5d6a7', '#ce93d8', '#80cbc4', '#f48fb1'];

    const datasets = sources.map((src, idx) => {
      const color = colorPalette[idx % colorPalette.length];
      const data = dateSet.map(date => {
        const rec = timeline.find(t => t.date === date && t.source === src);
        return rec ? rec.mentions : 0;
      });
      return {
        label: src,
        data,
        borderColor: color,
        backgroundColor: this.withAlpha(color, 0.2),
        tension: 0.25,
        pointRadius: 0,
        fill: true,
      } as any;
    });

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets,
      },
      options: {
        responsive: true,
        plugins: { legend: { display: true } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: 'rgba(255,255,255,0.08)' }, beginAtZero: true },
        }
      }
    });
  }

  private formatDdMm(dateStr: string): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dd = String(d).padStart(2, '0');
    const mm = String(m).padStart(2, '0');
    return `${dd}.${mm}`;
  }

  private withAlpha(hex: string, alpha: number): string {
    const m = hex.match(/^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i);
    if (!m) return hex;
    const r = parseInt(m[1], 16);
    const g = parseInt(m[2], 16);
    const b = parseInt(m[3], 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }

  isSelected(pid: string): boolean {
    return this.selected().includes(pid);
  }

  toggle(pid: string) {
    const set = new Set(this.selected());
    if (set.has(pid)) {
      set.delete(pid);
    } else {
      set.add(pid);
    }
    this.selected.set(Array.from(set));
  }

  goToCreator() {
    this.router.navigate(['/campaigns/new'], {
      queryParams: { trend_id: this.id, products: this.selected() },
    });
  }
}
