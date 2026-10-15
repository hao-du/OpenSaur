import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../../atoms/button/button.component';
import { TextComponent } from '../../atoms/text/text.component';
import { UserProfileMenuComponent } from '../../molecules/user-profile-menu/user-profile-menu.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, ButtonComponent, TextComponent, UserProfileMenuComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss'
})
export class HeaderComponent {
  userName = input<string>('');
  userEmail = input<string>('');

  toggleMenu = output<void>();
  logout = output<void>();
}
