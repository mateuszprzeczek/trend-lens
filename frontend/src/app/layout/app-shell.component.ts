import { Component, inject, effect } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BreakpointObserver } from '@angular/cdk/layout';
import { map, shareReplay } from 'rxjs/operators';
import { UIStateService } from '../core/state/ui.state';
import { CompanyStateService } from '../core/state/company.state';
import { TranslateModule } from '@ngx-translate/core';
import { TranslationService } from '../core/services/translation.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    TranslateModule,
  ],
  styleUrls: ['./app-shell.component.scss'],
  templateUrl: './app-shell.component.html',
})
export class AppShellComponent {
  private i18n = inject(TranslationService);
  private breakpoint = inject(BreakpointObserver);
  readonly isHandset$ = this.breakpoint.observe('(max-width: 768px)').pipe(
    map(result => result.matches),
    shareReplay({ bufferSize: 1, refCount: false })
  );
  isHandset = false;
  sidenavMode: 'over' | 'side' = 'side';
  sidenavOpened = true;

  // Inject UI state and company state for brand color
  ui = inject(UIStateService);
  companyState = inject(CompanyStateService);

  constructor() {
    // Responsive sidenav behavior
    this.isHandset$.subscribe(v => {
      this.isHandset = v;
      this.sidenavMode = v ? 'over' : 'side';
      this.sidenavOpened = !v;
    });

    // Apply brand primary color (mocked company state)
    effect(() => {
      const primary = this.companyState.company().brand_kit?.primary || '#90caf9';
      document.documentElement.style.setProperty('--brand-primary', primary);
    });
  }

  onNavItemClick(drawer: MatSidenav) {
    if (this.isHandset) {
      drawer.close();
    }
  }

  setLang(lang: 'pl' | 'en') {
    this.i18n.setLanguage(lang);
  }
}
