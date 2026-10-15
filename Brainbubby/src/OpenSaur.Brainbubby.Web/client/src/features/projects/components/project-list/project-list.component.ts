import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CardComponent } from '../../../../components/atoms/card/card.component';
import { ButtonComponent } from '../../../../components/atoms/button/button.component';
import { BadgeComponent, BadgeVariant } from '../../../../components/atoms/badge/badge.component';
import { IconComponent } from '../../../../components/atoms/icon/icon.component';
import { DialogComponent } from '../../../../components/organisms/dialog/dialog.component';
import { EmptyStateComponent } from '../../../../components/molecules/empty-state/empty-state.component';
import { ProjectDrawerComponent } from '../project-drawer/project-drawer.component';
import { ProjectFilterDrawerComponent } from '../project-filter-drawer/project-filter-drawer.component';
import { MemberDialogComponent } from '../../../project-permissions/components/member-dialog/member-dialog.component';
import { ProjectService } from '../../services/project.service';
import { ProjectListItem, ProjectDetail } from '../../models/project.model';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ButtonComponent,
    BadgeComponent,
    IconComponent,
    DialogComponent,
    EmptyStateComponent,
    ProjectDrawerComponent,
    ProjectFilterDrawerComponent,
    MemberDialogComponent
  ],
  templateUrl: './project-list.component.html',
  styleUrl: './project-list.component.scss'
})
export class ProjectListComponent implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly router = inject(Router);

  projects = signal<ProjectListItem[]>([]);
  loading = signal<boolean>(false);
  searchQuery = signal<string>('');

  // Drawer states
  drawerOpen = signal<boolean>(false);
  filterDrawerOpen = signal<boolean>(false);
  selectedProjectDetail = signal<ProjectDetail | null>(null);

  // Member dialog states
  memberDialogOpen = signal<boolean>(false);
  activeProjectId = signal<string | null>(null);
  activeProjectName = signal<string>('');
  activeProjectIsCreator = signal<boolean>(false);

  // Delete dialog states
  deleteDialogOpen = signal<boolean>(false);
  projectToDelete = signal<ProjectListItem | null>(null);
  deleting = signal<boolean>(false);

  filteredProjects = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const list = this.projects();
    if (!q) return list;
    return list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.description && p.description.toLowerCase().includes(q))
    );
  });

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.loading.set(true);
    this.projectService.getProjects().subscribe({
      next: (res) => {
        this.projects.set(res);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  getRoleBadgeVariant(role: string): BadgeVariant {
    switch (role) {
      case 'Creator':
        return 'primary';
      case 'CanEdit':
        return 'accent';
      default:
        return 'default';
    }
  }

  openCreateDrawer(): void {
    this.selectedProjectDetail.set(null);
    this.drawerOpen.set(true);
  }

  openEditDrawer(project: ProjectListItem): void {
    this.projectService.getProjectById(project.id).subscribe({
      next: (detail) => {
        this.selectedProjectDetail.set(detail);
        this.drawerOpen.set(true);
      }
    });
  }

  onProjectSaved(): void {
    this.drawerOpen.set(false);
    this.loadProjects();
  }

  openMemberDialog(project: ProjectListItem): void {
    this.activeProjectId.set(project.id);
    this.activeProjectName.set(project.name);
    this.activeProjectIsCreator.set(project.currentUserRole === 'Creator');
    this.memberDialogOpen.set(true);
  }

  confirmDelete(project: ProjectListItem): void {
    this.projectToDelete.set(project);
    this.deleteDialogOpen.set(true);
  }

  deleteProject(): void {
    const p = this.projectToDelete();
    if (!p) return;

    this.deleting.set(true);
    this.projectService.deleteProject(p.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.deleteDialogOpen.set(false);
        this.projectToDelete.set(null);
        this.loadProjects();
      },
      error: () => this.deleting.set(false)
    });
  }

  enterProject(project: ProjectListItem): void {
    // Navigate to explorer with active project
    this.router.navigate(['/explorer'], { queryParams: { projectId: project.id } });
  }
}
