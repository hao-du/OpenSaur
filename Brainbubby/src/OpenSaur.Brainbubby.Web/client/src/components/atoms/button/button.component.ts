import { Component, computed, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatRippleModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { IconComponent } from '../icon/icon.component';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, MatRippleModule, MatProgressSpinnerModule, IconComponent],
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss'
})
export class ButtonComponent {
  variant = input<ButtonVariant>('primary');
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
  icon = input<string | null>(null);
  type = input<'button' | 'submit' | 'reset'>('button');

  clicked = output<MouseEvent>();

  matButtonClasses = computed(() => {
    const base = 'mat-mdc-button-base';
    switch (this.variant()) {
      case 'primary':
        return `${base} mat-mdc-unelevated-button mat-primary`;
      case 'secondary':
        return `${base} mat-mdc-outlined-button`;
      case 'danger':
        return `${base} mat-mdc-unelevated-button mat-warn`;
      case 'ghost':
        return `${base} mat-mdc-button`;
      case 'icon':
        return `${base} mat-mdc-icon-button`;
      default:
        return base;
    }
  });
}
