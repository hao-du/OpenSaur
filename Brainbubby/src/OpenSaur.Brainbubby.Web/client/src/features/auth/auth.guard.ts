import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { AuthService } from './auth.service';
import { map } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);

  if (authService.isAuthenticated()) {
    return true;
  }

  return authService.loadCurrentProfile().pipe(
    map((profile) => {
      if (profile) {
        return true;
      }
      authService.redirectToLogin(state.url);
      return false;
    })
  );
};
