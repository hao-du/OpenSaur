import { loadOfflineJson, saveOfflineJson } from "../../../infrastructure/offline/offlineStorage";
import type { TemplateDetailDto } from "../../templates/dtos/TemplateDto";

export type OfflineTemplateRecord = TemplateDetailDto & {
  id: string;
  updatedAt: string;
};

const offlineTemplatesKey = "templates.list";

export function loadOfflineTemplates() {
  return loadOfflineJson<OfflineTemplateRecord[]>(offlineTemplatesKey) ?? [];
}

export function saveOfflineTemplates(templates: OfflineTemplateRecord[]) {
  saveOfflineJson(offlineTemplatesKey, templates);
}

export function upsertOfflineTemplate(record: Omit<OfflineTemplateRecord, "updatedAt">) {
  const currentTemplates = loadOfflineTemplates();
  const nextRecord: OfflineTemplateRecord = {
    ...record,
    updatedAt: new Date().toISOString(),
  };

  const existingIndex = currentTemplates.findIndex((item) => item.id === record.id);
  if (existingIndex >= 0) {
    currentTemplates[existingIndex] = nextRecord;
  } else {
    currentTemplates.unshift(nextRecord);
  }

  saveOfflineTemplates(currentTemplates);
}

export function removeOfflineTemplate(id: string) {
  const nextTemplates = loadOfflineTemplates().filter((item) => item.id !== id);
  saveOfflineTemplates(nextTemplates);
}
