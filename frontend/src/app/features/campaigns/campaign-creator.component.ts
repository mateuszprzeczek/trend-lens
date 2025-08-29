import { Component, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { FormsModule } from '@angular/forms';
import { CampaignsApiService } from '../../core/services/campaigns.api';
import { CampaignAssets } from '../../core/models/models';
import { TranslateModule } from '@ngx-translate/core';

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
    MatProgressBarModule,
    TranslateModule,
  ],
  styleUrls: ['./campaign-creator.component.scss'],
  templateUrl: './campaign-creator.component.html',
})
export class CampaignCreatorComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private api = inject(CampaignsApiService);
  private snack = inject(MatSnackBar);

  trendId = signal<string | null>(null);
  products = signal<string[]>([]);

  channels = { push: true, email: true } as { push: boolean; email: boolean };

  brand: { tone: string; primary: string; secondary: string; logo_url?: string } = {
    tone: '',
    primary: '#90caf9',
    secondary: '#ffcc80',
  };

  assets = {
    push: { title: '', body: '', cta_url: '', icon_url: '' },
    email: { subject: '', html: '', alt_text: '' },
  } as Required<CampaignAssets> & { push: { title: string; body: string; icon_url?: string; cta_url: string }; email: { subject: string; html: string; alt_text?: string } };

  schedule: string = '';
  budgets: { push?: number; email?: number } = {};

  campaignId = signal<string | null>(null);
  generating = signal(false);
  launching = signal(false);

  constructor() {
    const qpSig = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
    effect(() => {
      const qp = qpSig();
      const tid = qp.get('trend_id');
      let prods = qp.getAll('products');
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
