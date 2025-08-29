import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { UIStateService } from '../state/ui.state';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const ui = inject(UIStateService);
  ui.startLoading();
  return next(req).pipe(finalize(() => ui.stopLoading()));
};
