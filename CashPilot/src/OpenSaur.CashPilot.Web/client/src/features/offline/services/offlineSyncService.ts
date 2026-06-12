import { getBanks } from "../../banks/api/banksApi";
import { getCounterparties } from "../../counterparties/api/counterpartiesApi";
import { getCurrencies } from "../../currencies/api/currenciesApi";
import { getTags } from "../../tags/api/tagsApi";
import { getTemplateById, getTemplates } from "../../templates/api/templatesApi";
import type { OfflineMetadataSnapshot } from "../storages/offlineMetadataStore";
import { saveOfflineMetadataSnapshot } from "../storages/offlineMetadataStore";
import { loadOfflineTemplates, saveOfflineTemplates } from "../storages/offlineTemplatesStore";

export async function syncOfflineMetadata() {
  const [currencies, banks, counterparties, tags, templates] = await Promise.all([
    getCurrencies({ isActive: true, name: "", shortName: "" }),
    getBanks({ isActive: true, name: "", shortName: "" }),
    getCounterparties({ email: "", fullName: "", isActive: true, phoneNumber: "" }),
    getTags({ isActive: true, name: "" }),
    getTemplates({ isActive: true, name: "", templateType: "" }),
  ]);

  const templateDetails = await Promise.all(templates.map(async (template) => getTemplateById(template.id)));

  const snapshot: OfflineMetadataSnapshot = {
    banks,
    counterparties,
    currencies,
    savedAt: new Date().toISOString(),
    tags,
    templates: templateDetails,
  };

  saveOfflineMetadataSnapshot(snapshot);
  const currentTemplates = loadOfflineTemplates();
  if (currentTemplates.length === 0) {
    saveOfflineTemplates(templateDetails.map((template) => ({
      ...template,
      updatedAt: new Date().toISOString(),
    })));
  } else {
    const currentTemplateIds = new Set(currentTemplates.map((template) => template.id));
    const mergedTemplates = [
      ...currentTemplates,
      ...templateDetails
        .filter((template) => !currentTemplateIds.has(template.id))
        .map((template) => ({
          ...template,
          updatedAt: new Date().toISOString(),
        })),
    ];

    saveOfflineTemplates(mergedTemplates);
  }
  return snapshot;
}
