import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ButtonComponent } from '../../atoms/button/button.component';

@Component({
  selector: 'app-drawer',
  standalone: true,
  imports: [CommonModule, MatSidenavModule, ButtonComponent],
  templateUrl: './drawer.component.html',
  styleUrl: './drawer.component.scss'
})
export class DrawerComponent {
  isOpen = input<boolean>(false);
  title = input<string>('');
  subtitle = input<string | null>(null);

  close = output<void>();
}
