import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ProjectMember,
  WorkspaceUserCandidate,
  AssignProjectPermissionRequest,
  UpdateProjectPermissionRequest
} from '../models/project-permission.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectPermissionService {
  private readonly http = inject(HttpClient);

  getMembers(projectId: string): Observable<ProjectMember[]> {
    return this.http.get<ProjectMember[]>(`/api/projects/${projectId}/members`);
  }

  getCandidates(projectId: string): Observable<WorkspaceUserCandidate[]> {
    return this.http.get<WorkspaceUserCandidate[]>(`/api/projects/${projectId}/members/candidates`);
  }

  assignMember(projectId: string, request: AssignProjectPermissionRequest): Observable<ProjectMember> {
    return this.http.post<ProjectMember>(`/api/projects/${projectId}/members`, request);
  }

  updateMember(projectId: string, userId: string, request: UpdateProjectPermissionRequest): Observable<ProjectMember> {
    return this.http.put<ProjectMember>(`/api/projects/${projectId}/members/${userId}`, request);
  }

  revokeMember(projectId: string, userId: string): Observable<void> {
    return this.http.delete<void>(`/api/projects/${projectId}/members/${userId}`);
  }
}
