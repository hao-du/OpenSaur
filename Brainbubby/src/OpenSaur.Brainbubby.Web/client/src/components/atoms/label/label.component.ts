import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type LabelVariant = 'form' | 'caption' | 'title' | 'header' | 'body';

@Component({
  selector: 'app-label',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './label.component.html',
  styleUrl: './label.component.scss'
})
export class LabelComponent {
  text = input<string | null>(null);
  variant = input<LabelVariant>('form');
  required = input<boolean>(false);
  hint = input<string | null>(null);
  forId = input<string | null>(null);
  bold = input<boolean>(false);
}
