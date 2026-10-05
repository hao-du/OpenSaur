import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type LabelVariant = 'header' | 'title' | 'body' | 'caption';

@Component({
  selector: 'app-label',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './label.component.html',
  styleUrl: './label.component.scss'
})
export class LabelComponent {
  variant = input<LabelVariant>('body');
  bold = input<boolean>(false);
}
