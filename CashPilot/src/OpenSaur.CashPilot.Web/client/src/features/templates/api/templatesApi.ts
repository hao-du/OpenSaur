import { client } from "../../../infrastructure/http/client";
import type { TemplateDetailDto, TemplateFilterParams, TemplateListItemDto, UpsertTemplateRequestDto } from "../dtos/TemplateDto";

const templateTypeMap: Record<string, number> = {
  CashFlow: 1,
  Transfer: 2,
  Exchange: 3,
  BankAccount: 4
};

export async function getTemplates(filters: TemplateFilterParams) {
  return client.get<TemplateListItemDto[]>("/api/templates", {
    params: {
      isActive: filters.isActive,
      name: filters.name.trim().length > 0 ? filters.name.trim() : undefined,
      templateType: filters.templateType.length > 0 ? templateTypeMap[filters.templateType] : undefined
    }
  });
}

export async function getTemplateById(id: string) {
  return client.get<TemplateDetailDto>(`/api/templates/${id}`);
}

export async function createTemplate(request: UpsertTemplateRequestDto) {
  return client.post<TemplateDetailDto, UpsertTemplateRequestDto>("/api/templates", request);
}

export async function updateTemplate(id: string, request: UpsertTemplateRequestDto) {
  return client.put<TemplateDetailDto, UpsertTemplateRequestDto>(`/api/templates/${id}`, request);
}

export async function deleteTemplate(id: string) {
  await client.delete<void>(`/api/templates/${id}`);
}

