import type { BankDto } from "../../banks/dtos/BankDto";
import type { CounterpartyDto } from "../../counterparties/dtos/CounterpartyDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import type { TagDto } from "../../tags/dtos/TagDto";
import type { TemplateDetailDto } from "../../templates/dtos/TemplateDto";
import { loadOfflineJson, saveOfflineJson } from "../../../infrastructure/offline/offlineStorage";

export type OfflineMetadataSnapshot = {
  banks: BankDto[];
  counterparties: CounterpartyDto[];
  currencies: CurrencyDto[];
  savedAt: string;
  tags: TagDto[];
  templates: TemplateDetailDto[];
};

const metadataKey = "metadata.snapshot";
const anonymousMetadataKey = `${metadataKey}.anonymous`;

function getMetadataKey(ownerUserId?: string | null) {
  return ownerUserId == null || ownerUserId.trim().length === 0
    ? anonymousMetadataKey
    : `${metadataKey}.${ownerUserId.trim()}`;
}

export function loadOfflineMetadataSnapshot(ownerUserId?: string | null) {
  return loadOfflineJson<OfflineMetadataSnapshot>(getMetadataKey(ownerUserId));
}

export function saveOfflineMetadataSnapshot(snapshot: OfflineMetadataSnapshot, ownerUserId?: string | null) {
  const key = getMetadataKey(ownerUserId);
  saveOfflineJson(key, snapshot);
}
