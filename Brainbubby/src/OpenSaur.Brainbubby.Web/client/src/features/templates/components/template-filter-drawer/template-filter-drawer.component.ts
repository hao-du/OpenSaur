import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DrawerComponent } from '../../../../components/organisms/drawer/drawer.component';
import { ButtonComponent } from '../../../../components/atoms/button/button.component';
import { InputComponent } from '../../../../components/atoms/input/input.component';

@Component({
  selector: 'app-template-filter-drawer',
  standalone: true,
  imports: [CommonModule, DrawerComponent, ButtonComponent, InputComponent],
  templateUrl: './template-filter-drawer.component.html',
  styleUrl: './template-filter-drawer.component.scss'
})
export class TemplateFilterDrawerComponent {
  isOpen = input<boolean>(false);
  searchQuery = input<string>('');
  filteredCount = input<number>(0);
  totalCount = input<number>(0);

  searchQueryChange = output<string>();
  clear = output<void>();
  close = output<void>();
}

