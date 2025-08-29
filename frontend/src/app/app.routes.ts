import { Routes } from '@angular/router';
import { HomePageComponent } from './features/home/home.page';
import { TrendDetailComponent } from './features/trends/trend-detail.component';
import { CampaignMonitorComponent } from './features/campaigns/campaign-monitor.component';
import { CampaignReportComponent } from './features/reports/campaign-report.component';
import { CampaignCreatorComponent } from './features/campaigns/campaign-creator.component';

export const APP_ROUTES: Routes = [
  { path: '', pathMatch: 'full', component: HomePageComponent },
  { path: 'trends/:id', component: TrendDetailComponent },
  { path: 'campaigns/new', component: CampaignCreatorComponent },
  { path: 'campaigns/:id', component: CampaignMonitorComponent },
  { path: 'reports/campaign/:id', component: CampaignReportComponent },
  { path: '**', redirectTo: '' },
];