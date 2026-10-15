import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../atoms/icon/icon.component';
import { Heading3Component } from '../../atoms/heading-3/heading-3.component';
import { TextMutedBlockComponent } from '../../atoms/text-muted-block/text-muted-block.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, IconComponent, Heading3Component, TextMutedBlockComponent],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss'
})
export class EmptyStateComponent {
  @Input() icon: string = 'layout-dashboard';
  @Input() iconSize: number = 28;
  @Input() title: string = 'No items found';
  @Input() description: string = '';
}
