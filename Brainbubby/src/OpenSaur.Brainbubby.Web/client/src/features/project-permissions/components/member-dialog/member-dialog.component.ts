import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogComponent } from '../../../../components/organisms/dialog/dialog.component';
import { ButtonComponent } from '../../../../components/atoms/button/button.component';
import { AvatarComponent } from '../../../../components/atoms/avatar/avatar.component';
import { BadgeComponent } from '../../../../components/atoms/badge/badge.component';
import { IconComponent } from '../../../../components/atoms/icon/icon.component';
import { ProjectPermissionService } from '../../services/project-permission.service';
import {
  ProjectMember,
  ProjectPermissionType,
  WorkspaceUserCandidate
} from '../../models/project-permission.model';

@Component({
  selector: 'app-member-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DialogComponent,
    ButtonComponent,
    AvatarComponent,
    BadgeComponent
  ],
  templateUrl: './member-dialog.component.html',
  styleUrl: './member-dialog.component.scss'
})
export class MemberDialogComponent {
  private readonly permissionService = inject(ProjectPermissionService);

  isOpen = input<boolean>(false);
  projectId = input<string | null>(null);
  projectName = input<string>('');
  isCreator = input<boolean>(false);

  close = output<void>();

  members = signal<ProjectMember[]>([]);
  candidates = signal<WorkspaceUserCandidate[]>([]);
  loadingMembers = signal<boolean>(false);
  addingMember = signal<boolean>(false);

  selectedCandidateUserId = signal<string>('');
  selectedRole = signal<ProjectPermissionType>('CanEdit');

  availableCandidates = computed(() => {
    return this.candidates().filter(c => !c.alreadyAssigned);
  });

  constructor() {
    effect(() => {
      const open = this.isOpen();
      const pId = this.projectId();
      if (open && pId) {
        this.loadMembers(pId);
        if (this.isCreator()) {
          this.loadCandidates(pId);
        }
      } else {
        this.selectedCandidateUserId.set('');
      }
    });
  }

  loadMembers(projectId: string): void {
    this.loadingMembers.set(true);
    this.permissionService.getMembers(projectId).subscribe({
      next: (res) => {
        this.members.set(res);
        this.loadingMembers.set(false);
      },
      error: () => this.loadingMembers.set(false)
    });
  }

  loadCandidates(projectId: string): void {
    this.permissionService.getCandidates(projectId).subscribe({
      next: (res) => this.candidates.set(res),
      error: () => {}
    });
  }

  onCandidateSelect(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedCandidateUserId.set(val);
  }

  onRoleSelect(event: Event): void {
    const val = (event.target as HTMLSelectElement).value as ProjectPermissionType;
    this.selectedRole.set(val);
  }

  addMember(): void {
    const pId = this.projectId();
    const uId = this.selectedCandidateUserId();
    if (!pId || !uId) return;

    this.addingMember.set(true);
    this.permissionService.assignMember(pId, {
      userId: uId,
      permission: this.selectedRole()
    }).subscribe({
      next: () => {
        this.addingMember.set(false);
        this.selectedCandidateUserId.set('');
        this.loadMembers(pId);
        this.loadCandidates(pId);
      },
      error: () => this.addingMember.set(false)
    });
  }

  updatePermission(member: ProjectMember, event: Event): void {
    const pId = this.projectId();
    const newPerm = (event.target as HTMLSelectElement).value as ProjectPermissionType;
    if (!pId || newPerm === member.permission) return;

    this.permissionService.updateMember(pId, member.userId, {
      permission: newPerm
    }).subscribe({
      next: () => this.loadMembers(pId)
    });
  }

  revokeMember(member: ProjectMember): void {
    const pId = this.projectId();
    if (!pId) return;

    this.permissionService.revokeMember(pId, member.userId).subscribe({
      next: () => {
        this.loadMembers(pId);
        if (this.isCreator()) {
          this.loadCandidates(pId);
        }
      }
    });
  }
}
