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
import { NgIf } from '@angular/common';
import { UIStateService } from '../core/state/ui.state';
import { CompanyStateService } from '../core/state/company.state';

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
    NgIf,
  ],
  styles: [
    `
    :host, .container { height: 100%; display: block; }
    .spacer { flex: 1 1 auto; }
    .toolbar-content { display: flex; align-items: center; gap: 8px; width: 100%; }
    .brand { font-weight: 600; letter-spacing: 0.3px; }
    .search-field { max-width: 420px; width: 100%; }
    .avatar { width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.12); }
    .content { padding: 16px; }
    @media (max-width: 768px) {
      .search-field { max-width: 200px; }
    }
    a.menu-link { text-decoration: none; color: inherit; display: block; }
    `
  ],
  template: `
    <mat-sidenav-container class="container">
      <mat-sidenav #drawer [mode]="sidenavMode" [opened]="sidenavOpened">
        <mat-nav-list>
          <a mat-list-item class="menu-link" routerLink="/" routerLinkActive="active" (click)="onNavItemClick(drawer)">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>
          <a mat-list-item class="menu-link" [routerLink]="['/campaigns', 1]" routerLinkActive="active" (click)="onNavItemClick(drawer)">
            <mat-icon matListItemIcon>campaign</mat-icon>
            <span matListItemTitle>Kampanie</span>
          </a>
          <a mat-list-item class="menu-link" [routerLink]="['/reports/campaign', 1]" routerLinkActive="active" (click)="onNavItemClick(drawer)">
            <mat-icon matListItemIcon>insights</mat-icon>
            <span matListItemTitle>Raporty</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary">
          <div class="toolbar-content">
            <mat-progress-bar *ngIf="ui.isLoadingGlobal()" mode="indeterminate" color="primary" style="position:absolute; left:0; right:0; top:0;"></mat-progress-bar>
            <button mat-icon-button aria-label="Menu" (click)="drawer.toggle()" *ngIf="isHandset">
              <mat-icon>menu</mat-icon>
            </button>
            <span class="brand">TrendLens</span>
            <span class="spacer"></span>
            <mat-form-field class="search-field" appearance="outline">
              <mat-label>Szukaj</mat-label>
              <input matInput placeholder="Trendy, kampanie..." />
              <button mat-icon-button matSuffix aria-label="search">
                <mat-icon>search</mat-icon>
              </button>
            </mat-form-field>
            <button mat-icon-button aria-label="Powiadomienia">
              <mat-icon>notifications</mat-icon>
            </button>
            <span class="avatar" aria-label="Avatar">
              <mat-icon>account_circle</mat-icon>
            </span>
          </div>
        </mat-toolbar>

        <div class="content">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
})
export class AppShellComponent {
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
}
