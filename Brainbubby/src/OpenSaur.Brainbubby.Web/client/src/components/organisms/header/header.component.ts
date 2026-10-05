import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../atoms/button/button.component';
import { UserProfileMenuComponent } from '../../molecules/user-profile-menu/user-profile-menu.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ButtonComponent, UserProfileMenuComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  userName = input<string>('Super Administrator');
  userEmail = input<string>('superadmin@Brainbubby.local');

  toggleMenu = output<void>();
  logout = output<void>();
}
