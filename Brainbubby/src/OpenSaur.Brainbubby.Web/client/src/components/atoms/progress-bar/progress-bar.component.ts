import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TextComponent } from '../text/text.component';

@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [CommonModule, TextComponent],
  templateUrl: './progress-bar.component.html',
  styleUrl: './progress-bar.component.scss'
})
export class ProgressBarComponent {
  indeterminate = input<boolean>(true);
  value = input<number>(0);
  status = input<string>('Initializing...');
  subStatus = input<string>('Please wait');
}
