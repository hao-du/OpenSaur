import { Component } from '@angular/core';

@Component({
  selector: 'app-heading-3',
  standalone: true,
  template: `
    <h3 class="heading-3">
      <ng-content></ng-content>
    </h3>
  `,
  styles: [`
    :host {
      display: block;
    }
    .heading-3 {
      font-family: inherit;
      font-size: var(--font-size-h3, 0.9375rem);
      line-height: var(--line-height-h3, 1.375rem);
      font-weight: 600;
      color: var(--text-primary, #1c1917);
      margin: 0;
    }
  `]
})
export class Heading3Component {}

