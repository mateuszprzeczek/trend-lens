import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';

/**
 * Auth interceptor that:
 * - Adds Authorization: Bearer <token> header when localStorage.tl_token is present.
 * - If no token, adds x-company-id header from localStorage.tl_company (for dev usage).
 * - Rewrites request URL to always be prefixed with /api (proxy will forward in dev).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  let headers = req.headers;

  // Prefer Authorization Bearer when available
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('tl_token') : null;
  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  } else {
    // Fallback: dev-only x-company-id header
    const companyId = typeof localStorage !== 'undefined' ? localStorage.getItem('tl_company') : null;
    if (companyId) {
      headers = headers.set('x-company-id', companyId);
    }
  }

  // Ensure URL is rewritten to /api + original URL path
  const originalUrl = req.url || '';
  const normalizedUrl = originalUrl.startsWith('/') ? originalUrl : `/${originalUrl}`;
  const apiUrl = `/api${normalizedUrl}`;

  const cloned: HttpRequest<unknown> = req.clone({
    url: apiUrl,
    headers,
    // withCredentials could be toggled here if needed in the future
  });

  return next(cloned);
};
