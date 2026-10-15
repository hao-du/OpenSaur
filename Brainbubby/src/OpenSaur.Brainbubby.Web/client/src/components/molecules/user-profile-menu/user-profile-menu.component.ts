import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { MatRippleModule } from '@angular/material/core';
import { AvatarComponent } from '../../atoms/avatar/avatar.component';
import { IconComponent } from '../../atoms/icon/icon.component';
import { TextComponent } from '../../atoms/text/text.component';

@Component({
  selector: 'app-user-profile-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, MatMenuModule, MatButtonModule, MatRippleModule, AvatarComponent, IconComponent, TextComponent],
  templateUrl: './user-profile-menu.component.html',
  styleUrl: './user-profile-menu.component.scss'
})
export class UserProfileMenuComponent {
  userName = input<string>('');
  userEmail = input<string>('');

  logout = output<void>();
}
