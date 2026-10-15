import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { CurrentProfileDto } from './auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);

  readonly profile = signal<CurrentProfileDto | null>(null);
  readonly isAuthenticated = signal<boolean>(false);
  readonly isLoading = signal<boolean>(true);

  loadCurrentProfile(): Observable<CurrentProfileDto | null> {
    this.isLoading.set(true);
    return this.http.get<CurrentProfileDto>('/api/profile/current').pipe(
      tap((p) => {
        this.profile.set(p);
        this.isAuthenticated.set(true);
        this.isLoading.set(false);
      }),
      catchError(() => {
        this.profile.set(null);
        this.isAuthenticated.set(false);
        this.isLoading.set(false);
        return of(null);
      })
    );
  }

  redirectToLogin(returnUrl?: string): void {
    const currentPath = returnUrl ?? (window.location.pathname + window.location.search);
    const loginUrl = new URL('/auth/login', window.location.origin);
    loginUrl.searchParams.set('returnUrl', currentPath || '/');
    window.location.assign(loginUrl.toString());
  }

  logout(returnUrl: string = '/'): void {
    const logoutUrl = new URL('/auth/logout', window.location.origin);
    logoutUrl.searchParams.set('returnUrl', returnUrl);
    window.location.assign(logoutUrl.toString());
  }
}
