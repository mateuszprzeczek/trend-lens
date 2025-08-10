import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe, PercentPipe } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatIconModule } from '@angular/material/icon';
import { TrendsApiService } from '../../core/services/trends.api';
import { TrendRecommendation } from '../../core/models/models';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    DecimalPipe,
    PercentPipe,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSliderModule,
    MatIconModule,
  ],
  styles: [
    `
    :host { display: block; }
    .header { display:flex; align-items:center; justify-content:space-between; gap: 16px; margin-bottom: 16px; }
    .filters { display:flex; flex-wrap:wrap; align-items:center; gap: 16px; }
    .grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
    .sources { display:flex; align-items:flex-end; gap:4px; height: 24px; margin-top: 8px; }
    .bar { width: 8px; background: rgba(255,255,255,0.5); border-radius: 2px; }
    .card-header { display:flex; align-items:center; justify-content:space-between; gap: 8px; }
    .muted { opacity: 0.8; font-size: 12px; }
    .metrics { display:flex; gap: 12px; align-items: baseline; }
    .metric { display:flex; flex-direction:column; }
    .metric .label { font-size: 12px; opacity: .7; }
    .metric .value { font-weight: 600; }
    .actions { display:flex; justify-content:flex-end; }

    .slider-wrap { min-width: 220px; }
    .select-wrap { min-width: 140px; }
    `
  ],
  template: `
    <div class="header">
      <h1 style="margin:0">Nowe trendy</h1>
      <div class="filters">
        <div class="slider-wrap">
          <label class="muted">Promień: {{ radius() }} km</label>
          <mat-slider min="10" max="500" step="10" [discrete]="true" [showTickMarks]="true" [value]="radius()" (valueChange)="radius.set($event)"></mat-slider>
        </div>
        <div class="select-wrap">
          <mat-form-field appearance="outline" style="width: 100%; min-width: 140px;">
            <mat-label>Limit</mat-label>
            <mat-select [value]="limit()" (valueChange)="limit.set($event)">
              <mat-option [value]="6">6</mat-option>
              <mat-option [value]="12">12</mat-option>
              <mat-option [value]="18">18</mat-option>
              <mat-option [value]="24">24</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        <button mat-flat-button color="primary" (click)="refresh()" [disabled]="loading()">
          <mat-icon>refresh</mat-icon>
          Odśwież
        </button>
      </div>
    </div>

    <div class="grid" *ngIf="trends(); else emptyState">
      <mat-card *ngFor="let t of trends()" (click)="openTrend(t)" style="cursor:pointer;">
        <mat-card-header>
          <div class="card-header">
            <mat-card-title>{{ t.name }}</mat-card-title>
            <span class="muted">#{{ t.id }}</span>
          </div>
        </mat-card-header>
        <mat-card-content>
          <div class="metrics">
            <div class="metric">
              <span class="label">Score</span>
              <span class="value">{{ t.score | number:'1.2-2' }}</span>
            </div>
            <div class="metric">
              <span class="label">Wzrost 7d</span>
              <span class="value">{{ t.growth_7d | percent:'1.0-0' }}</span>
            </div>
            <div class="metric" *ngIf="t.forecast_peak_in_days != null">
              <span class="label">Szczyt za</span>
              <span class="value">{{ t.forecast_peak_in_days }} d</span>
            </div>
          </div>
          <div class="sources" *ngIf="t.sources as s">
            <ng-container *ngFor="let entry of sourceEntries(t)">
              <div class="bar" [title]="entry.key + ': ' + entry.value" [style.height.%]="entry.height" [style.background]="entry.color"></div>
            </ng-container>
          </div>
        </mat-card-content>
      </mat-card>
    </div>

    <ng-template #emptyState>
      <p class="muted" *ngIf="!loading(); else loadingTpl">Brak danych do wyświetlenia.</p>
    </ng-template>

    <ng-template #loadingTpl>
      <p class="muted">Ładowanie...</p>
    </ng-template>
  `,
})
export class HomePageComponent {
  private api = inject(TrendsApiService);
  private router = inject(Router);

  // Kraków defaults
  readonly lat = 50.0647;
  readonly lng = 19.945;

  // Signals for filters and data
  radius = signal<number>(200);
  limit = signal<number>(6);
  trends = signal<TrendRecommendation[] | null>(null);
  loading = signal<boolean>(false);

  // Manual refresh trigger to control when requests fire
  private refreshTick = signal<number>(0);

  // Create an effect that runs when refreshTick OR the filters change
  // For a simple UX, we require clicking the button to refresh (as requested),
  // but also perform an initial load in the constructor by calling refresh().
  private _refreshEffect = effect(() => {
    // read signals to establish dependencies
    const _ = this.refreshTick();
    const radius = this.radius();
    const limit = this.limit();

    this.loading.set(true);
    this.api
      .getRecommendations({ lat: this.lat, lng: this.lng, radius_km: radius, limit })
      .subscribe({
        next: (data) => {
          this.trends.set(data);
          this.loading.set(false);
        },
        error: () => {
          this.trends.set([]);
          this.loading.set(false);
        },
      });
  });

  constructor() {
    // initial load
    this.refresh();
  }

  refresh() {
    this.refreshTick.update((v) => v + 1);
  }

  openTrend(t: TrendRecommendation) {
    this.router.navigate(['/trends', t.id]);
  }

  // Build normalized source bars
  sourceEntries(t: TrendRecommendation) {
    const entries = Object.entries(t.sources || {});
    if (!entries.length) return [] as Array<{ key: string; value: number; height: number; color: string }>;
    const max = Math.max(...entries.map(([, v]) => v));
    const palette = ['#80cbc4', '#90caf9', '#ffcc80', '#f48fb1', '#a5d6a7', '#ce93d8'];
    return entries.map(([key, value], idx) => ({
      key,
      value,
      height: max > 0 ? Math.max(8, (value / max) * 100) : 8, // at least 8%
      color: palette[idx % palette.length],
    }));
  }
}
