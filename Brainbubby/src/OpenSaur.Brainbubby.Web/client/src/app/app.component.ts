import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../components/organisms/header/header.component';
import { SideMenuComponent } from '../components/organisms/side-menu/side-menu.component';
import { DrawerComponent } from '../components/organisms/drawer/drawer.component';
import { PrepareSessionComponent } from '../features/auth/components/prepare-session/prepare-session.component';
import { AuthService } from '../features/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SideMenuComponent, DrawerComponent, PrepareSessionComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  private readonly authService = inject(AuthService);

  readonly isLoading = computed(() => this.authService.isLoading());
  readonly isAuthenticated = computed(() => this.authService.isAuthenticated());

  mobileMenuOpen = signal<boolean>(false);
  sidebarCollapsed = signal<boolean>(false);

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.authService.loadCurrentProfile().subscribe({
        next: (profile) => {
          if (!profile) {
            this.authService.redirectToLogin();
          }
        }
      });
    }
  }

  readonly userName = computed(() => {
    const profile = this.authService.profile();
    if (!profile) return '';
    const fullName = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim();
    return fullName || profile.userName || profile.email;
  });

  readonly userEmail = computed(() => {
    return this.authService.profile()?.email ?? '';
  });

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }

  onLogout(): void {
    this.authService.logout();
  }
}
