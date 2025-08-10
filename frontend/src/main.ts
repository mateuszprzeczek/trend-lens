import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { APP_ROUTES } from './app/app.routes';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { errorInterceptor } from './app/core/interceptors/error.interceptor';
import { loadingInterceptor } from './app/core/interceptors/loading.interceptor';
import { AppComponent } from './app/app.component';
import { demoInterceptor } from './app/core/interceptors/demo.interceptor';
import { importProvidersFrom } from '@angular/core';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

// Toggle demo mode (mock API) via environment flag
import { environment } from './environments/environment';
const useDemo = environment.useDemo; // set in environments

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(APP_ROUTES, withComponentInputBinding()),
    provideHttpClient(withInterceptors([
      // Demo interceptor first so it can short-circuit before auth/url rewrite
      ...(useDemo ? [demoInterceptor] : []),
      loadingInterceptor,
      authInterceptor,
      errorInterceptor,
    ])),
    importProvidersFrom(
      TranslateModule.forRoot({
        loader: { provide: TranslateLoader, useFactory: HttpLoaderFactory, deps: [HttpClient] },
        defaultLanguage: 'en'
      })
    ),
    provideAnimationsAsync(),
  ],
}).catch((err) => console.error(err));
