import { Component } from '@angular/core';

@Component({
  selector: 'app-text-caption',
  standalone: true,
  template: `
    <span class="text-caption">
      <ng-content></ng-content>
    </span>
  `,
  styles: [`
    :host {
      display: inline-block;

      &.block {
        display: block;
      }
    }
    .text-caption {
      font-family: inherit;
      font-size: var(--font-size-caption, 0.75rem);
      line-height: var(--line-height-caption, 1rem);
      color: var(--text-caption, #a8a29e);
    }
  `]
})
export class TextCaptionComponent {}

