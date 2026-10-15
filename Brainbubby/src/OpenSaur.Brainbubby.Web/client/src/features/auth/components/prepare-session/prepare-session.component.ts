import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressBarComponent } from '../../../../components/atoms/progress-bar/progress-bar.component';
import { HeadingComponent } from '../../../../components/atoms/heading/heading.component';
import { TextComponent } from '../../../../components/atoms/text/text.component';

@Component({
  selector: 'app-prepare-session',
  standalone: true,
  imports: [CommonModule, ProgressBarComponent, HeadingComponent, TextComponent],
  templateUrl: './prepare-session.component.html',
  styleUrl: './prepare-session.component.scss'
})
export class PrepareSessionComponent {}

