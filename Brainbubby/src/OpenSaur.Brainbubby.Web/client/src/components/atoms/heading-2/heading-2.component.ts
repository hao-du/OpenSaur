import { Component } from '@angular/core';

@Component({
  selector: 'app-heading-2',
  standalone: true,
  template: `
    <h2 class="heading-2">
      <ng-content></ng-content>
    </h2>
  `,
  styles: [`
    :host {
      display: block;
    }
    .heading-2 {
      font-family: inherit;
      font-size: var(--font-size-h2, 1.125rem);
      line-height: var(--line-height-h2, 1.625rem);
      font-weight: 600;
      letter-spacing: -0.01em;
      color: var(--text-primary, #1c1917);
      margin: 0;
    }
  `]
})
export class Heading2Component {}

