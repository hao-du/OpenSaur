import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonModule } from '@angular/material/button';
import { AvatarComponent } from '../../atoms/avatar/avatar.component';
import { IconComponent } from '../../atoms/icon/icon.component';

@Component({
  selector: 'app-user-profile-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, MatMenuModule, MatButtonModule, AvatarComponent, IconComponent],
  templateUrl: './user-profile-menu.component.html',
  styleUrl: './user-profile-menu.component.scss'
})
export class UserProfileMenuComponent {
  userName = input<string>('Super Administrator');
  userEmail = input<string>('superadmin@Brainbubby.local');

  logout = output<void>();
}
