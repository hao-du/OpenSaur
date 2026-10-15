import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ProjectListItem,
  ProjectDetail,
  CreateProjectRequest,
  UpdateProjectRequest,
  TemplateItem
} from '../models/project.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/projects';

  getProjects(): Observable<ProjectListItem[]> {
    return this.http.get<ProjectListItem[]>(this.baseUrl);
  }

  getProjectById(id: string): Observable<ProjectDetail> {
    return this.http.get<ProjectDetail>(`${this.baseUrl}/${id}`);
  }

  createProject(request: CreateProjectRequest): Observable<ProjectDetail> {
    return this.http.post<ProjectDetail>(this.baseUrl, request);
  }

  updateProject(id: string, request: UpdateProjectRequest): Observable<ProjectDetail> {
    return this.http.put<ProjectDetail>(`${this.baseUrl}/${id}`, request);
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getTemplates(): Observable<TemplateItem[]> {
    return this.http.get<TemplateItem[]>('/api/templates');
  }
}
