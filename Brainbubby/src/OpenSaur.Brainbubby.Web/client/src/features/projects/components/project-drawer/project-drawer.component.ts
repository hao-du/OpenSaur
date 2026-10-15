import { Component, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DrawerComponent } from '../../../../components/organisms/drawer/drawer.component';
import { ButtonComponent } from '../../../../components/atoms/button/button.component';
import { InputComponent } from '../../../../components/atoms/input/input.component';
import { ProjectService } from '../../services/project.service';
import { ProjectDetail, TemplateItem } from '../../models/project.model';

@Component({
  selector: 'app-project-drawer',
  standalone: true,
  imports: [CommonModule, FormsModule, DrawerComponent, ButtonComponent, InputComponent],
  templateUrl: './project-drawer.component.html',
  styleUrl: './project-drawer.component.scss'
})
export class ProjectDrawerComponent {
  private readonly projectService = inject(ProjectService);

  isOpen = input<boolean>(false);
  project = input<ProjectDetail | null>(null);

  close = output<void>();
  saved = output<void>();

  name = signal<string>('');
  description = signal<string>('');
  selectedTemplateId = signal<string>('');
  templates = signal<TemplateItem[]>([]);
  saving = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  isEditing = signal<boolean>(false);

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const p = this.project();
      if (open) {
        this.loadTemplates();
        if (p) {
          this.isEditing.set(true);
          this.name.set(p.name);
          this.description.set(p.description || '');
          this.selectedTemplateId.set(p.instructionTemplateNodeId || '');
        } else {
          this.isEditing.set(false);
          this.name.set('');
          this.description.set('');
          this.selectedTemplateId.set('');
        }
        this.errorMessage.set(null);
      }
    });
  }

  loadTemplates(): void {
    this.projectService.getTemplates().subscribe({
      next: (res) => this.templates.set(res),
      error: () => {}
    });
  }

  onDescriptionInput(event: Event): void {
    const val = (event.target as HTMLTextAreaElement).value;
    this.description.set(val);
  }

  onTemplateSelect(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedTemplateId.set(val);
  }

  save(): void {
    const trimmedName = this.name().trim();
    if (!trimmedName) return;

    this.saving.set(true);
    this.errorMessage.set(null);

    const templateId = this.selectedTemplateId() ? this.selectedTemplateId() : null;

    if (this.isEditing() && this.project()) {
      this.projectService.updateProject(this.project()!.id, {
        name: trimmedName,
        description: this.description().trim() || null,
        instructionTemplateNodeId: templateId
      }).subscribe({
        next: () => {
          this.saving.set(false);
          this.saved.emit();
        },
        error: (err) => {
          this.saving.set(false);
          this.errorMessage.set(err?.error?.message || 'Failed to update project.');
        }
      });
    } else {
      this.projectService.createProject({
        name: trimmedName,
        description: this.description().trim() || null,
        instructionTemplateNodeId: templateId
      }).subscribe({
        next: () => {
          this.saving.set(false);
          this.saved.emit();
        },
        error: (err) => {
          this.saving.set(false);
          this.errorMessage.set(err?.error?.message || 'Failed to create project.');
        }
      });
    }
  }
}
