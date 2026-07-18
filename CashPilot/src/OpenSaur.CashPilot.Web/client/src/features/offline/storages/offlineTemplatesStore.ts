import { loadOfflineJson, saveOfflineJson } from "../../../infrastructure/offline/offlineStorage";
import type { TemplateDetailDto } from "../../templates/dtos/TemplateDto";

export type OfflineTemplateRecord = TemplateDetailDto & {
  id: string;
  updatedAt: string;
};

const offlineTemplatesKey = "templates.list";
const anonymousTemplatesKey = `${offlineTemplatesKey}.anonymous`;

function getOfflineTemplatesKey(ownerUserId?: string | null) {
  return ownerUserId == null || ownerUserId.trim().length === 0
    ? anonymousTemplatesKey
    : `${offlineTemplatesKey}.${ownerUserId.trim()}`;
}

export function loadOfflineTemplates(ownerUserId?: string | null) {
  return loadOfflineJson<OfflineTemplateRecord[]>(getOfflineTemplatesKey(ownerUserId)) ?? [];
}

export function saveOfflineTemplates(templates: OfflineTemplateRecord[], ownerUserId?: string | null) {
  saveOfflineJson(getOfflineTemplatesKey(ownerUserId), templates);
}

export function upsertOfflineTemplate(record: Omit<OfflineTemplateRecord, "updatedAt">, ownerUserId?: string | null) {
  const currentTemplates = loadOfflineTemplates(ownerUserId);
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

  saveOfflineTemplates(currentTemplates, ownerUserId);
}

export function removeOfflineTemplate(id: string, ownerUserId?: string | null) {
  const nextTemplates = loadOfflineTemplates(ownerUserId).filter((item) => item.id !== id);
  saveOfflineTemplates(nextTemplates, ownerUserId);
}
