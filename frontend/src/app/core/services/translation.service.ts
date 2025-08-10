import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class TranslationService {
  constructor(private translate: TranslateService) {
    this.translate.addLangs(['en', 'pl']);
    this.translate.setDefaultLang('en');

    const browserLang = this.translate.getBrowserLang();
    this.translate.use(browserLang?.match(/en|pl/) ? browserLang : 'en');
  }

  /**
   * Change the current language
   * @param lang Language code (e.g., 'en', 'pl')
   */
  setLanguage(lang: string): void {
    this.translate.use(lang);
  }

  /**
   * Get the current language
   * @returns Current language code
   */
  getCurrentLanguage(): string {
    return this.translate.currentLang;
  }

  /**
   * Get all supported languages
   * @returns Array of language codes
   */
  getLanguages(): string[] {
    return this.translate.getLangs();
  }
}
