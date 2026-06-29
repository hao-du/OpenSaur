import type { BankDto } from "../../banks/dtos/BankDto";
import type { CounterpartyDto } from "../../counterparties/dtos/CounterpartyDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import type { TagDto } from "../../tags/dtos/TagDto";
import type { TemplateDetailDto } from "../../templates/dtos/TemplateDto";
import { loadOfflineJson, removeOfflineJson, saveOfflineJson } from "../../../infrastructure/offline/offlineStorage";

export type OfflineMetadataSnapshot = {
  banks: BankDto[];
  counterparties: CounterpartyDto[];
  currencies: CurrencyDto[];
  savedAt: string;
  tags: TagDto[];
  templates: TemplateDetailDto[];
};

const metadataKey = "metadata.snapshot";

function getMetadataKey(ownerUserId?: string | null) {
  return ownerUserId == null || ownerUserId.trim().length === 0
    ? metadataKey
    : `${metadataKey}.${ownerUserId.trim()}`;
}

export function loadOfflineMetadataSnapshot(ownerUserId?: string | null) {
  if (ownerUserId != null && ownerUserId.trim().length > 0) {
    removeOfflineJson(metadataKey);
  }

  return loadOfflineJson<OfflineMetadataSnapshot>(getMetadataKey(ownerUserId));
}

export function saveOfflineMetadataSnapshot(snapshot: OfflineMetadataSnapshot, ownerUserId?: string | null) {
  const key = getMetadataKey(ownerUserId);
  saveOfflineJson(key, snapshot);

  if (key !== metadataKey) {
    removeOfflineJson(metadataKey);
  }
}
