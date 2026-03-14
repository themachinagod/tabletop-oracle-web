import { HttpInterceptorFn } from '@angular/common/http';

/**
 * HTTP interceptor that ensures credentials (cookies) are sent
 * with every API request for BFF session authentication.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const apiReq = req.clone({ withCredentials: true });
  return next(apiReq);
};
