import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type HeadingLevel = 1 | 2 | 3 | 4 | '1' | '2' | '3' | '4';

@Component({
  selector: 'app-heading',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './heading.component.html',
  styleUrl: './heading.component.scss'
})
export class HeadingComponent {
  level = input<HeadingLevel>(1);
}

