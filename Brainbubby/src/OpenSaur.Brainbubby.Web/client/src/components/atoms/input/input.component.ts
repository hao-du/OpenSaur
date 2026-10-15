import { Component, forwardRef, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true
    }
  ],
  templateUrl: './input.component.html',
  styleUrl: './input.component.scss'
})
export class InputComponent implements ControlValueAccessor {
  label = input<string | null>(null);
  placeholder = input<string>('');
  type = input<string>('text');
  required = input<boolean>(false);
  errorMessage = input<string | null>(null);
  prefixIcon = input<string | null>(null);
  suffixIcon = input<string | null>(null);

  value = input<string>('');
  valueChange = output<string>();
  disabled = input<boolean>(false);

  internalValue = '';
  isDisabled = false;

  private onChange = (val: string) => {};
  private onTouched = () => {};

  writeValue(val: any): void {
    this.internalValue = val ?? '';
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  onInputChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.internalValue = target.value;
    this.onChange(this.internalValue);
    this.valueChange.emit(this.internalValue);
  }

  onBlur(): void {
    this.onTouched();
  }
}
