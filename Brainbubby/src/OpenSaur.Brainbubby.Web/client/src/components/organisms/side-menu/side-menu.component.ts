import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../../atoms/icon/icon.component';

export interface NavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-side-menu',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  templateUrl: './side-menu.component.html',
  styleUrl: './side-menu.component.scss'
})
export class SideMenuComponent {
  collapsed = input<boolean>(false);

  navItems: NavItem[] = [
    { label: 'Projects', route: '/projects', icon: 'layout-dashboard' },
    { label: 'File Explorer', route: '/explorer', icon: 'folder-open' },
    { label: 'Instruction Templates', route: '/templates', icon: 'file-text' },
    { label: 'Snapshots & History', route: '/snapshots', icon: 'history' },
    { label: 'Shared Files', route: '/shared-files', icon: 'share-2' },
    { label: 'Settings', route: '/settings', icon: 'settings' }
  ];
}
