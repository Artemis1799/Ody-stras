import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Les cookies HttpOnly sont automatiquement envoyés par le navigateur
  // Il faut juste s'assurer que withCredentials est à true
  const clonedRequest = req.clone({
    withCredentials: true
  });
  
  return next(clonedRequest);
};
