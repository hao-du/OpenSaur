import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';

export type BadgeVariant = 'primary' | 'warn' | 'accent' | 'default';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule, MatChipsModule],
  templateUrl: './badge.component.html',
  styleUrl: './badge.component.scss'
})
export class BadgeComponent {
  variant = input<BadgeVariant>('default');
}
