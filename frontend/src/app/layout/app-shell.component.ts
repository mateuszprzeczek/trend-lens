import { Component, inject, effect, computed } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { BreakpointObserver, LayoutModule } from '@angular/cdk/layout';
import { map } from 'rxjs/operators';
import { toSignal } from '@angular/core/rxjs-interop';
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
    LayoutModule,
  ],
  styleUrls: ['./app-shell.component.scss'],
  templateUrl: './app-shell.component.html',
})
export class AppShellComponent {
  private i18n = inject(TranslationService);
  private breakpoint = inject(BreakpointObserver);
  readonly isHandset = toSignal(
    this.breakpoint.observe('(max-width: 768px)').pipe(map(result => result.matches)),
    { initialValue: false }
  );
  readonly sidenavMode = computed<'over' | 'side'>(() => (this.isHandset() ? 'over' : 'side'));
  readonly sidenavOpened = computed<boolean>(() => !this.isHandset());

  ui = inject(UIStateService);
  companyState = inject(CompanyStateService);

  constructor() {
    effect(() => {
      const primary = this.companyState.company().brand_kit?.primary || '#90caf9';
      document.documentElement.style.setProperty('--brand-primary', primary);
    });
  }

  onNavItemClick(drawer: MatSidenav) {
    if (this.isHandset()) {
      drawer.close();
    }
  }

  setLang(lang: 'pl' | 'en') {
    this.i18n.setLanguage(lang);
  }
}
