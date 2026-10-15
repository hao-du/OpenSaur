import { Component, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

export interface TabItem<T = string> {
  id: T;
  label: string;
  icon?: string;
}

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './tabs.component.html',
  styleUrl: './tabs.component.scss'
})
export class TabsComponent<T = string> {
  tabs = input.required<TabItem<T>[]>();
  activeTab = model.required<T>();

  selectTab(id: T): void {
    this.activeTab.set(id);
  }
}

