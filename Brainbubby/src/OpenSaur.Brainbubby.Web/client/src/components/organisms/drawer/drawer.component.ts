import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { ButtonComponent } from '../../atoms/button/button.component';
import { Heading2Component } from '../../atoms/heading-2/heading-2.component';
import { TextCaptionComponent } from '../../atoms/text-caption/text-caption.component';

@Component({
  selector: 'app-drawer',
  standalone: true,
  imports: [CommonModule, MatSidenavModule, ButtonComponent, Heading2Component, TextCaptionComponent],
  templateUrl: './drawer.component.html',
  styleUrl: './drawer.component.scss'
})
export class DrawerComponent {
  isOpen = input<boolean>(false);
  title = input<string>('');
  subtitle = input<string | null>(null);
  size = input<'narrow' | 'wide' | 'full'>('narrow');
  closeOnBackdropClick = input<boolean>(false);

  close = output<void>();
}
