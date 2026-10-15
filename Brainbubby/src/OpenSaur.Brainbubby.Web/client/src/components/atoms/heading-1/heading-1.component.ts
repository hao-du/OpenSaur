import { Component } from '@angular/core';

@Component({
  selector: 'app-heading-1',
  standalone: true,
  template: `
    <h1 class="heading-1">
      <ng-content></ng-content>
    </h1>
  `,
  styles: [`
    :host {
      display: block;
    }
    .heading-1 {
      font-family: inherit;
      font-size: var(--font-size-h1, 1.5rem);
      line-height: var(--line-height-h1, 2rem);
      font-weight: 700;
      letter-spacing: -0.02em;
      color: var(--text-primary, #1c1917);
      margin: 0;
    }
  `]
})
export class Heading1Component {}

