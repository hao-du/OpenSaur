import { getBanks } from "../../banks/api/banksApi";
import { getCounterparties } from "../../counterparties/api/counterpartiesApi";
import { getCurrencies } from "../../currencies/api/currenciesApi";
import { getTags } from "../../tags/api/tagsApi";
import { getTemplates } from "../../templates/api/templatesApi";
import { loadOfflineTemplates, saveOfflineTemplates } from "../storages/offlineTemplatesStore";
import type { OfflineMetadataSnapshot } from "../storages/offlineMetadataStore";
import { saveOfflineMetadataSnapshot } from "../storages/offlineMetadataStore";

export async function syncOfflineMetadata() {
  const [currencies, banks, counterparties, tags, templates] = await Promise.all([
    getCurrencies({ isActive: true, name: "", shortName: "" }),
    getBanks({ isActive: true, name: "", shortName: "" }),
    getCounterparties({ email: "", fullName: "", isActive: true, phoneNumber: "" }),
    getTags({ isActive: true, name: "" }),
    getTemplates({ isActive: true, name: "", templateType: "" }, true),
  ]);

  const snapshot: OfflineMetadataSnapshot = {
    banks,
    counterparties,
    currencies,
    savedAt: new Date().toISOString(),
    tags,
    templates,
  };

  saveOfflineMetadataSnapshot(snapshot);

  const currentTemplates = loadOfflineTemplates();
  if (currentTemplates.length === 0) {
    saveOfflineTemplates(templates.map((template) => ({
      ...template,
      updatedAt: new Date().toISOString(),
    })));
    return snapshot;
  }

  const currentTemplateIds = new Set(currentTemplates.map((template) => template.id));
  const mergedTemplates = [
    ...currentTemplates,
    ...templates
      .filter((template) => !currentTemplateIds.has(template.id))
      .map((template) => ({
        ...template,
        updatedAt: new Date().toISOString(),
      })),
  ];

  saveOfflineTemplates(mergedTemplates);
  return snapshot;
}
