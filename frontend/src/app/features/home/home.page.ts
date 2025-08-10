import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe, PercentPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatIconModule } from '@angular/material/icon';
import { TrendsApiService } from '../../core/services/trends.api';
import { TrendRecommendation } from '../../core/models/models';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DecimalPipe,
    PercentPipe,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSliderModule,
    MatIconModule,
    TranslateModule,
  ],
  styleUrls: ['./home.page.scss'],
  templateUrl: './home.page.html',
})
export class HomePageComponent {
  private api = inject(TrendsApiService);
  private router = inject(Router);

  readonly lat = 50.0647;
  readonly lng = 19.945;

  radius = signal<number>(200);
  limit = signal<number>(6);
  trends = signal<TrendRecommendation[] | null>(null);
  loading = signal<boolean>(false);

  private refreshTick = signal<number>(0);

  private _refreshEffect = effect(() => {
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
    this.refresh();
  }

  refresh() {
    this.refreshTick.update((v) => v + 1);
  }

  openTrend(t: TrendRecommendation) {
    this.router.navigate(['/trends', t.id]);
  }

  sourceEntries(t: TrendRecommendation) {
    const entries = Object.entries(t.sources || {});
    if (!entries.length) return [] as Array<{ key: string; value: number; height: number; color: string }>;
    const max = Math.max(...entries.map(([, v]) => v));
    const palette = ['#80cbc4', '#90caf9', '#ffcc80', '#f48fb1', '#a5d6a7', '#ce93d8'];
    return entries.map(([key, value], idx) => ({
      key,
      value,
      height: max > 0 ? Math.max(8, (value / max) * 100) : 8,
      color: palette[idx % palette.length],
    }));
  }
}
