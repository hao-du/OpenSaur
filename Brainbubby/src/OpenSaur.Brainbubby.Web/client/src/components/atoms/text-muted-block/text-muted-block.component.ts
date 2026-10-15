import { Component } from '@angular/core';

@Component({
  selector: 'app-text-muted-block',
  standalone: true,
  template: `
    <p class="text-muted-block">
      <ng-content></ng-content>
    </p>
  `,
  styles: [`
    :host {
      display: block;
      margin-top: 4px;
    }
    .text-muted-block {
      font-family: inherit;
      font-size: var(--font-size-body, 0.875rem);
      line-height: var(--line-height-body, 1.25rem);
      color: var(--text-muted, #78716c);
      margin: 0;
    }
  `]
})
export class TextMutedBlockComponent {}

