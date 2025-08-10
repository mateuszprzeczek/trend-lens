import { AfterViewInit, Component, DestroyRef, Input, OnDestroy, ViewChild, ElementRef, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { TrendsApiService } from '../../core/services/trends.api';
import { TrendMatch } from '../../core/models/models';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-trend-detail',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTableModule, MatChipsModule],
  styles: [
    `
    :host { display:block; }
    .section { margin-bottom: 16px; }
    .header { display:flex; align-items:center; justify-content:space-between; gap: 12px; }
    .muted { opacity: .8; font-size: 13px; }
    table { width: 100%; }
    .chips { display:flex; gap:8px; flex-wrap:wrap; }
    canvas { max-height: 240px; }
    `
  ],
  template: `
    <div class="section">
      <div class="header">
        <h1 style="margin:0">Trend #{{ id }}</h1>
        <div>
          <button mat-stroked-button color="primary" [disabled]="selected().length === 0" (click)="goToCreator()">
            <mat-icon>auto_fix_high</mat-icon>
            Wygeneruj kampanię ({{ selected().length }})
          </button>
        </div>
      </div>
    </div>

    <mat-card class="section">
      <mat-card-header>
        <mat-card-title>Dlaczego to rekomendujemy</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <ul *ngIf="explanations().length; else noExp">
          <li *ngFor="let e of explanations()">{{ e }}</li>
        </ul>
        <ng-template #noExp>
          <p class="muted">Brak wyjaśnień z backendu – placeholder.</p>
        </ng-template>
      </mat-card-content>
    </mat-card>

    <mat-card class="section">
      <mat-card-header>
        <mat-card-title>Źródła i momentum</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <canvas #momentumChart></canvas>
      </mat-card-content>
    </mat-card>

    <mat-card class="section">
      <mat-card-header>
        <mat-card-title>Dopasowania produktów</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="chips" *ngIf="selected().length">
          <mat-chip-set>
            <mat-chip *ngFor="let pid of selected()" (removed)="toggle(pid)">
              {{ pid }}
              <button matChipRemove aria-label="Usuń">
                <mat-icon>cancel</mat-icon>
              </button>
            </mat-chip>
          </mat-chip-set>
        </div>
        <table mat-table [dataSource]="matches()" *ngIf="matches(); else loadingTpl">
          <ng-container matColumnDef="product">
            <th mat-header-cell *matHeaderCellDef> Produkt </th>
            <td mat-cell *matCellDef="let m"> {{ m.product_id }} </td>
          </ng-container>

          <ng-container matColumnDef="match">
            <th mat-header-cell *matHeaderCellDef> MatchScore </th>
            <td mat-cell *matCellDef="let m"> {{ m.match_score | number:'1.2-2' }} </td>
          </ng-container>

          <ng-container matColumnDef="profit">
            <th mat-header-cell *matHeaderCellDef> ProfitScore </th>
            <td mat-cell *matCellDef="let m"> {{ m.profit_score | number:'1.2-2' }} </td>
          </ng-container>

          <ng-container matColumnDef="reasons">
            <th mat-header-cell *matHeaderCellDef> Reasons </th>
            <td mat-cell *matCellDef="let m"> {{ (m.reasons || []).join('; ') }} </td>
          </ng-container>

          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef> Akcje </th>
            <td mat-cell *matCellDef="let m">
              <button mat-button color="primary" (click)="toggle(m.product_id)" *ngIf="!isSelected(m.product_id)">
                <mat-icon>add_shopping_cart</mat-icon>
                Dodaj
              </button>
              <button mat-button color="warn" (click)="toggle(m.product_id)" *ngIf="isSelected(m.product_id)">
                <mat-icon>remove_shopping_cart</mat-icon>
                Usuń
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
        </table>
        <ng-template #loadingTpl>
          <p class="muted">Ładowanie dopasowań...</p>
        </ng-template>
      </mat-card-content>
    </mat-card>
  `,
})
export class TrendDetailComponent implements AfterViewInit, OnDestroy {
  @Input() id!: string;
  @ViewChild('momentumChart') momentumChartRef!: ElementRef<HTMLCanvasElement>;

  private api = inject(TrendsApiService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  matches = signal<TrendMatch[] | null>(null);
  explanations = signal<string[]>([]); // placeholder; could be fed when backend provides
  selected = signal<string[]>([]);

  displayedColumns = ['product', 'match', 'profit', 'reasons', 'actions'];

  private chart: Chart | null = null;

  constructor() {
    // Load matches when id is available
    effect(() => {
      const trendId = this.id;
      if (!trendId) return;
      this.api.getMatches(trendId).subscribe({
        next: (data) => this.matches.set(data),
        error: () => this.matches.set([]),
      });
    });
  }

  ngAfterViewInit(): void {
    // Mock momentum data for MVP
    const labels = Array.from({ length: 20 }, (_, i) => `T-${20 - i}`);
    const values = labels.map((_, i) => 50 + Math.round(20 * Math.sin(i / 3)) + (Math.random() * 6 - 3));

    this.chart = new Chart(this.momentumChartRef.nativeElement.getContext('2d')!, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Momentum',
            data: values,
            borderColor: '#90caf9',
            backgroundColor: 'rgba(144,202,249,0.2)',
            tension: 0.25,
            pointRadius: 0,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: 'rgba(255,255,255,0.08)' } },
        },
        plugins: { legend: { display: false } },
      },
    });

    // Ensure chart is destroyed with component
    this.destroyRef.onDestroy(() => this.ngOnDestroy());
  }

  ngOnDestroy(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
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
