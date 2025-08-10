import { Injectable, signal } from '@angular/core';
import { Company } from '../models/models';

@Injectable({ providedIn: 'root' })
export class CompanyStateService {
  company = signal<Company>({
    id: 'demo',
    name: 'Demo Co',
    geo_center: { lat: 50.0647, lng: 19.945 },
    radius_km: 200,
    language: 'pl',
    brand_kit: { primary: '#90caf9', secondary: '#ffcc80', tone: 'Energetyczny' },
  });
}
