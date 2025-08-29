import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const originalUrl = req.url || '';
  const isAbsolute = /^https?:\/\//i.test(originalUrl);
  const isAsset = originalUrl.startsWith('/assets') || originalUrl.startsWith('./assets') || originalUrl.startsWith('assets/');

  let headers = req.headers;

  if (!isAbsolute && !isAsset) {
    const token = typeof localStorage !== 'undefined' ? localStorage.getItem('tl_token') : null;
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    } else {
      const companyId = typeof localStorage !== 'undefined' ? localStorage.getItem('tl_company') : null;
      if (companyId) {
        headers = headers.set('x-company-id', companyId);
      }
    }
  }

  let url = originalUrl;
  if (!isAbsolute && !isAsset) {
    const normalizedUrl = originalUrl.startsWith('/') ? originalUrl : `/${originalUrl}`;
    url = `/api${normalizedUrl}`;
  }

  const cloned: HttpRequest<unknown> = req.clone({
    url,
    headers,
  });

  return next(cloned);
};
