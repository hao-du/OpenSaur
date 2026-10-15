import { Component, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DrawerComponent } from '../../../../components/organisms/drawer/drawer.component';
import { ButtonComponent } from '../../../../components/atoms/button/button.component';
import { InputComponent } from '../../../../components/atoms/input/input.component';
import { LabelComponent } from '../../../../components/atoms/label/label.component';
import { MarkdownEditorComponent } from '../../../../components/organisms/markdown-editor/markdown-editor.component';
import { TemplateService } from '../../services/template.service';
import { InstructionTemplate } from '../../models/template.model';

@Component({
  selector: 'app-template-drawer',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DrawerComponent,
    ButtonComponent,
    InputComponent,
    LabelComponent,
    MarkdownEditorComponent
  ],
  templateUrl: './template-drawer.component.html',
  styleUrl: './template-drawer.component.scss'
})
export class TemplateDrawerComponent {
  private readonly templateService = inject(TemplateService);

  isOpen = input<boolean>(false);
  template = input<InstructionTemplate | null>(null);
  isSuperAdmin = input<boolean>(false);

  close = output<void>();
  saved = output<void>();

  name = signal<string>('');
  description = signal<string>('');
  content = signal<string>('');
  saving = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  isEditing = signal<boolean>(false);

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const t = this.template();
      if (open) {
        if (t) {
          this.isEditing.set(true);
          this.name.set(t.name);
          this.description.set(t.description || '');
          this.content.set(t.content || '');
        } else {
          this.isEditing.set(false);
          this.name.set('');
          this.description.set('');
          this.content.set('');
        }
        this.errorMessage.set(null);
      }
    });
  }

  onDescriptionInput(event: Event): void {
    const val = (event.target as HTMLTextAreaElement).value;
    this.description.set(val);
  }

  save(): void {
    const trimmedName = this.name().trim();
    if (!trimmedName) return;

    this.saving.set(true);
    this.errorMessage.set(null);

    const payload = {
      name: trimmedName,
      description: this.description().trim() || null,
      content: this.content() || ''
    };

    if (this.isEditing() && this.template()) {
      this.templateService.updateTemplate(this.template()!.id, payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.saved.emit();
        },
        error: (err) => {
          this.saving.set(false);
          this.errorMessage.set(err?.error?.message || 'Failed to update template.');
        }
      });
    } else {
      this.templateService.createTemplate(payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.saved.emit();
        },
        error: (err) => {
          this.saving.set(false);
          this.errorMessage.set(err?.error?.message || 'Failed to create template.');
        }
      });
    }
  }
}

