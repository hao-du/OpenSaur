import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InstructionTemplate, CreateTemplateRequest, UpdateTemplateRequest } from '../models/template.model';

@Injectable({
  providedIn: 'root'
})
export class TemplateService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/templates';

  getTemplates(): Observable<InstructionTemplate[]> {
    return this.http.get<InstructionTemplate[]>(this.baseUrl);
  }

  getTemplateById(id: string): Observable<InstructionTemplate> {
    return this.http.get<InstructionTemplate>(`${this.baseUrl}/${id}`);
  }

  createTemplate(req: CreateTemplateRequest): Observable<InstructionTemplate> {
    return this.http.post<InstructionTemplate>(this.baseUrl, req);
  }

  updateTemplate(id: string, req: UpdateTemplateRequest): Observable<InstructionTemplate> {
    return this.http.put<InstructionTemplate>(`${this.baseUrl}/${id}`, req);
  }

  deleteTemplate(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}

