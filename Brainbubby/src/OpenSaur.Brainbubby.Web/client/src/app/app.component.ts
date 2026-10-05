import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from '../components/organisms/header/header.component';
import { SideMenuComponent } from '../components/organisms/side-menu/side-menu.component';
import { DrawerComponent } from '../components/organisms/drawer/drawer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent, SideMenuComponent, DrawerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  mobileMenuOpen = signal<boolean>(false);
  sidebarCollapsed = signal<boolean>(false);

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update(v => !v);
  }
}
