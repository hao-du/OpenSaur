import { Component } from '@angular/core';

@Component({
  selector: 'app-text-muted-inline',
  standalone: true,
  template: `
    <span class="text-muted-inline">
      <ng-content></ng-content>
    </span>
  `,
  styles: [`
    :host {
      display: inline-block;
      vertical-align: middle;
    }
    .text-muted-inline {
      font-family: inherit;
      font-size: var(--font-size-body, 0.875rem);
      line-height: var(--line-height-body, 1.25rem);
      color: var(--text-muted, #78716c);
    }
  `]
})
export class TextMutedInlineComponent {}

