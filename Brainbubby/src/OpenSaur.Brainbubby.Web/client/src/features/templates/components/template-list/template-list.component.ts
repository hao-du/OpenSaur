import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ButtonComponent } from '../../../../components/atoms/button/button.component';
import { InputComponent } from '../../../../components/atoms/input/input.component';
import { IconComponent } from '../../../../components/atoms/icon/icon.component';
import { Heading1Component } from '../../../../components/atoms/heading-1/heading-1.component';
import { TextMutedBlockComponent } from '../../../../components/atoms/text-muted-block/text-muted-block.component';
import { TextMutedInlineComponent } from '../../../../components/atoms/text-muted-inline/text-muted-inline.component';
import { TextCaptionComponent } from '../../../../components/atoms/text-caption/text-caption.component';
import { DialogComponent } from '../../../../components/organisms/dialog/dialog.component';
import { EmptyStateComponent } from '../../../../components/molecules/empty-state/empty-state.component';
import { DataTableComponent } from '../../../../components/organisms/data-table/data-table.component';
import { TemplateDrawerComponent } from '../template-drawer/template-drawer.component';
import { TemplateFilterDrawerComponent } from '../template-filter-drawer/template-filter-drawer.component';
import { TemplateService } from '../../services/template.service';
import { AuthService } from '../../../auth/auth.service';
import { InstructionTemplate } from '../../models/template.model';

@Component({
  selector: 'app-template-list',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    ButtonComponent,
    IconComponent,
    Heading1Component,
    TextMutedBlockComponent,
    TextCaptionComponent,
    DialogComponent,
    EmptyStateComponent,
    DataTableComponent,
    TemplateDrawerComponent,
    TemplateFilterDrawerComponent
  ],
  templateUrl: './template-list.component.html',
  styleUrl: './template-list.component.scss'
})
export class TemplateListComponent implements OnInit {
  private readonly templateService = inject(TemplateService);
  private readonly authService = inject(AuthService);

  templates = signal<InstructionTemplate[]>([]);
  loading = signal<boolean>(false);
  searchQuery = signal<string>('');
  filterDrawerOpen = signal<boolean>(false);

  // Delete dialog states
  deleteDialogOpen = signal<boolean>(false);
  templateToDelete = signal<InstructionTemplate | null>(null);
  deleting = signal<boolean>(false);

  // Selected template for drawer
  drawerOpen = signal<boolean>(false);
  selectedTemplate = signal<InstructionTemplate | null>(null);

  isSuperAdmin = computed(() => {
    return this.authService.profile()?.isSuperAdministrator ?? false;
  });

  filteredTemplates = computed(() => {
    const q = this.searchQuery().toLowerCase().trim();
    const list = this.templates();
    if (!q) return list;
    return list.filter(t =>
      t.name.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
  });

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.loading.set(true);
    this.templateService.getTemplates().subscribe({
      next: (res) => {
        this.templates.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  openCreateDrawer(): void {
    this.selectedTemplate.set(null);
    this.drawerOpen.set(true);
  }

  openEditDrawer(tpl: InstructionTemplate): void {
    this.selectedTemplate.set(tpl);
    this.drawerOpen.set(true);
  }

  confirmDelete(tpl: InstructionTemplate): void {
    this.templateToDelete.set(tpl);
    this.deleteDialogOpen.set(true);
  }

  executeDelete(): void {
    const tpl = this.templateToDelete();
    if (!tpl) return;

    this.deleting.set(true);
    this.templateService.deleteTemplate(tpl.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteDialogOpen.set(false);
        this.templateToDelete.set(null);
        this.loadTemplates();
      },
      error: () => {
        this.deleting.set(false);
      }
    });
  }

  onTemplateSaved(): void {
    this.drawerOpen.set(false);
    this.selectedTemplate.set(null);
    this.loadTemplates();
  }
}

