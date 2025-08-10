import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { APP_ROUTES } from './app/app.routes';
import { authInterceptor } from './app/core/interceptors/auth.interceptor';
import { errorInterceptor } from './app/core/interceptors/error.interceptor';
import { loadingInterceptor } from './app/core/interceptors/loading.interceptor';
import { AppComponent } from './app/app.component';
import { demoInterceptor } from './app/core/interceptors/demo.interceptor';

// Toggle demo mode (mock API). When true, UI uses mock data via DemoInterceptor.
const useDemo = true; // set to false to hit real backend via /api proxy

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
    provideAnimationsAsync(),
  ],
}).catch((err) => console.error(err));
