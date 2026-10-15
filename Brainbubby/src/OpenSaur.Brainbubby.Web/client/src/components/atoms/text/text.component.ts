import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type TextVariant = 'body' | 'muted' | 'caption' | 'error' | 'success' | 'form';

@Component({
  selector: 'app-text',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './text.component.html',
  styleUrl: './text.component.scss'
})
export class TextComponent {
  variant = input<TextVariant>('body');
  bold = input<boolean>(false);
  tag = input<'p' | 'span' | 'div'>('span');
  
  // Specific for form labels if used as label
  required = input<boolean>(false);
  hint = input<string | null>(null);
  forId = input<string | null>(null);
}
