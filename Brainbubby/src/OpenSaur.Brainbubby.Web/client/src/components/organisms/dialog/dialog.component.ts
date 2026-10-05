import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule } from '@angular/material/dialog';
import { ButtonComponent, ButtonVariant } from '../../atoms/button/button.component';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, ButtonComponent],
  templateUrl: './dialog.component.html',
  styleUrl: './dialog.component.scss'
})
export class DialogComponent {
  isOpen = input<boolean>(false);
  title = input<string>('Confirmation');
  confirmText = input<string>('Confirm');
  cancelText = input<string>('Cancel');
  confirmVariant = input<ButtonVariant>('primary');
  loading = input<boolean>(false);

  confirm = output<void>();
  cancel = output<void>();
}
