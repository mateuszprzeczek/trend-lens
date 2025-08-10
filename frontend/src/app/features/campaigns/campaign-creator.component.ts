import { Component, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { CampaignsApiService } from '../../core/services/campaigns.api';
import { CampaignAssets } from '../../core/models/models';

@Component({
  selector: 'app-campaign-creator',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatTabsModule,
    MatSnackBarModule,
    MatIconModule,
  ],
  styles: [
    `
    :host { display:block; }
    .layout { display:grid; gap:16px; }
    .row { display:flex; flex-wrap:wrap; gap:16px; }
    .section-title { margin: 0 0 8px 0; }
    .muted { opacity: .8; font-size: 13px; }
    .grid-2 { display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px; }
    .actions { display:flex; gap:12px; justify-content:flex-end; }
    textarea { width: 100%; min-height: 120px; }
    .disabled-info { opacity: .5; }
    .budget-grid { display:grid; gap:12px; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); }
    `
  ],
  template: `
    <h1 style="margin:0 0 12px 0">Kreator kampanii</h1>
    <p class="muted">Trend: <strong>{{ trendId() || '—' }}</strong> · Produkty: <strong>{{ products().join(', ') || '—' }}</strong></p>

    <!-- Step 1: Channels -->
    <mat-card>
      <mat-card-header>
        <mat-card-title>Krok 1: Wybór kanałów</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="row">
          <mat-checkbox [(ngModel)]="channels.push">Push</mat-checkbox>
          <mat-checkbox [(ngModel)]="channels.email">Email</mat-checkbox>
          <mat-checkbox disabled class="disabled-info">Meta (wkrótce)</mat-checkbox>
          <mat-checkbox disabled class="disabled-info">Google Ads (wkrótce)</mat-checkbox>
        </div>
        <p class="muted" *ngIf="!channels.push && !channels.email">Wybierz przynajmniej jeden kanał.</p>
      </mat-card-content>
    </mat-card>

    <!-- Step 2: Brand kit -->
    <mat-card>
      <mat-card-header>
        <mat-card-title>Krok 2: Brand kit</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="grid-2">
          <mat-form-field appearance="outline">
            <mat-label>Tonalność</mat-label>
            <input matInput [(ngModel)]="brand.tone" placeholder="np. Energetyczny, profesjonalny" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Kolor podstawowy</mat-label>
            <input matInput [(ngModel)]="brand.primary" placeholder="#90caf9" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Kolor dodatkowy</mat-label>
            <input matInput [(ngModel)]="brand.secondary" placeholder="#ffcc80" />
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Logo URL (opcjonalnie)</mat-label>
            <input matInput [(ngModel)]="brand.logo_url" placeholder="https://..." />
          </mat-form-field>
        </div>
        <div class="row" style="align-items:center; gap:12px; margin-top:8px;">
          <span class="muted">Podgląd:</span>
          <span [style.background]="brand.primary" style="display:inline-block;width:24px;height:24px;border-radius:4px;"></span>
          <span [style.background]="brand.secondary" style="display:inline-block;width:24px;height:24px;border-radius:4px;"></span>
          <span class="muted">Ton: {{ brand.tone || '—' }}</span>
        </div>
      </mat-card-content>
    </mat-card>

    <!-- Step 3: Assets preview -->
    <mat-card>
      <mat-card-header>
        <mat-card-title>Krok 3: Podgląd assetów</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <mat-tab-group>
          <mat-tab label="Push">
            <div class="grid-2" style="margin-top:12px;">
              <mat-form-field appearance="outline">
                <mat-label>Tytuł</mat-label>
                <input matInput [(ngModel)]="assets.push.title" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>CTA URL</mat-label>
                <input matInput [(ngModel)]="assets.push.cta_url" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="full">
                <mat-label>Treść</mat-label>
                <textarea matInput [(ngModel)]="assets.push.body"></textarea>
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Ikona URL (opcjonalnie)</mat-label>
                <input matInput [(ngModel)]="assets.push.icon_url" />
              </mat-form-field>
            </div>
          </mat-tab>
          <mat-tab label="Email">
            <div class="grid-2" style="margin-top:12px;">
              <mat-form-field appearance="outline">
                <mat-label>Temat</mat-label>
                <input matInput [(ngModel)]="assets.email.subject" />
              </mat-form-field>
              <mat-form-field appearance="outline">
                <mat-label>Alt text (opcjonalnie)</mat-label>
                <input matInput [(ngModel)]="assets.email.alt_text" />
              </mat-form-field>
              <mat-form-field appearance="outline" class="full">
                <mat-label>HTML</mat-label>
                <textarea matInput [(ngModel)]="assets.email.html"></textarea>
              </mat-form-field>
            </div>
          </mat-tab>
        </mat-tab-group>
      </mat-card-content>
      <mat-card-actions class="actions">
        <button mat-stroked-button color="primary" (click)="onGenerate()" [disabled]="generating() || !canGenerate()">
          <mat-icon>auto_fix_high</mat-icon>
          Generuj
        </button>
      </mat-card-actions>
    </mat-card>

    <!-- Step 4: Schedule & budgets -->
    <mat-card>
      <mat-card-header>
        <mat-card-title>Krok 4: Harmonogram i budżety</mat-card-title>
      </mat-card-header>
      <mat-card-content>
        <div class="grid-2">
          <mat-form-field appearance="outline">
            <mat-label>Start (data i czas)</mat-label>
            <input matInput type="datetime-local" [(ngModel)]="schedule" />
          </mat-form-field>
        </div>
        <div class="budget-grid" style="margin-top:12px;">
          <mat-form-field appearance="outline" *ngIf="channels.push">
            <mat-label>Budżet Push (PLN)</mat-label>
            <input matInput type="number" min="0" [(ngModel)]="budgets.push" />
          </mat-form-field>
          <mat-form-field appearance="outline" *ngIf="channels.email">
            <mat-label>Budżet Email (PLN)</mat-label>
            <input matInput type="number" min="0" [(ngModel)]="budgets.email" />
          </mat-form-field>
        </div>
      </mat-card-content>
      <mat-card-actions class="actions">
        <button mat-flat-button color="accent" (click)="onLaunch()" [disabled]="launching() || !campaignId()">
          <mat-icon>rocket_launch</mat-icon>
          Uruchom kampanię
        </button>
      </mat-card-actions>
    </mat-card>
  `,
})
export class CampaignCreatorComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(CampaignsApiService);
  private snack = inject(MatSnackBar);

  // Query params
  trendId = signal<string | null>(null);
  products = signal<string[]>([]);

  // Channels state
  channels = { push: true, email: true } as { push: boolean; email: boolean };

  // Brand kit state
  brand: { tone: string; primary: string; secondary: string; logo_url?: string } = {
    tone: '',
    primary: '#90caf9',
    secondary: '#ffcc80',
  };

  // Assets draft (editable in UI). Keep defaults to avoid undefined bindings
  assets = {
    push: { title: '', body: '', cta_url: '', icon_url: '' },
    email: { subject: '', html: '', alt_text: '' },
  } as Required<CampaignAssets> & { push: { title: string; body: string; icon_url?: string; cta_url: string }; email: { subject: string; html: string; alt_text?: string } };

  // Schedule and budgets
  schedule: string = '';
  budgets: { push?: number; email?: number } = {};

  // Backend campaign state
  campaignId = signal<string | null>(null);
  generating = signal(false);
  launching = signal(false);

  constructor() {
    // Read query params
    this.route.queryParamMap.subscribe((qp) => {
      const tid = qp.get('trend_id');
      let prods = qp.getAll('products');
      // Support comma-separated string as well
      if (prods.length === 0) {
        const p = qp.get('products');
        if (p) prods = p.split(',');
      }
      this.trendId.set(tid);
      this.products.set(prods.filter(Boolean));
    });
  }

  canGenerate(): boolean {
    return !!this.trendId() && this.products().length > 0 && (this.channels.push || this.channels.email);
  }

  onGenerate() {
    if (!this.canGenerate()) {
      this.snack.open('Uzupełnij wymagane dane (trend i produkty, co najmniej jeden kanał).', 'Zamknij', { duration: 3000 });
      return;
    }
    this.generating.set(true);
    const channels = [this.channels.push ? 'push' : null, this.channels.email ? 'email' : null].filter(Boolean) as string[];
    const body: any = {
      trend_id: this.trendId()!,
      products: this.products(),
      channels,
      brand_preferences: { ...this.brand },
    };
    this.api.generate(body).subscribe({
      next: (campaign) => {
        this.campaignId.set(campaign.id);
        // Prefill assets if provided by backend
        const a = campaign.assets || {};
        if (a.push) {
          this.assets.push.title = a.push.title || this.assets.push.title;
          this.assets.push.body = a.push.body || this.assets.push.body;
          this.assets.push.cta_url = a.push.cta_url || this.assets.push.cta_url;
          this.assets.push.icon_url = a.push.icon_url || this.assets.push.icon_url;
        }
        if (a.email) {
          this.assets.email.subject = a.email.subject || this.assets.email.subject;
          this.assets.email.html = a.email.html || this.assets.email.html;
          this.assets.email.alt_text = a.email.alt_text || this.assets.email.alt_text;
        }
        this.snack.open('Wygenerowano kampanię.', 'OK', { duration: 2500 });
        this.generating.set(false);
      },
      error: (err) => {
        console.error(err);
        this.snack.open('Błąd podczas generowania kampanii.', 'Zamknij', { duration: 3500 });
        this.generating.set(false);
      }
    });
  }

  onLaunch() {
    const cid = this.campaignId();
    if (!cid) {
      this.snack.open('Najpierw wygeneruj kampanię.', 'Zamknij', { duration: 3000 });
      return;
    }
    this.launching.set(true);
    const budgetsRecord: Record<string, number> = {};
    if (this.channels.push && typeof this.budgets.push === 'number') budgetsRecord['push'] = this.budgets.push;
    if (this.channels.email && typeof this.budgets.email === 'number') budgetsRecord['email'] = this.budgets.email;

    const body: any = {
      campaign_id: cid,
      schedule: this.schedule ? new Date(this.schedule).toISOString() : undefined,
      budgets: Object.keys(budgetsRecord).length ? budgetsRecord : undefined,
    };

    this.api.launch(body).subscribe({
      next: () => {
        this.snack.open('Kampania uruchomiona!', 'OK', { duration: 2500 });
        this.launching.set(false);
        this.router.navigate(['/campaigns', cid]);
      },
      error: (err) => {
        console.error(err);
        this.snack.open('Błąd podczas uruchamiania kampanii.', 'Zamknij', { duration: 3500 });
        this.launching.set(false);
      }
    });
  }
}
