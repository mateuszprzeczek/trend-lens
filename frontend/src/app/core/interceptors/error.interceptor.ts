import { HttpErrorResponse, HttpEvent, HttpInterceptorFn } from '@angular/common/http';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { inject } from '@angular/core';
import { ToastService } from '../services/toast.service';

/**
 * Intercepts HTTP errors (4xx/5xx) and shows a toast message.
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  return next(req).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err && err.status >= 400) {
        let message = 'Wystąpił błąd. Spróbuj ponownie.';
        try {
          const serverMsg = (err.error && (err.error.message || err.error.error || err.error.detail)) || err.message;
          if (serverMsg) message = String(serverMsg);
        } catch {}
        toast.error(message);
      }
      return throwError(() => err);
    })
  );
};
