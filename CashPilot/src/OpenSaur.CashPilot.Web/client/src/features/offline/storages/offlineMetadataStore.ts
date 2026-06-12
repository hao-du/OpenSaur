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

export function loadOfflineMetadataSnapshot() {
  return loadOfflineJson<OfflineMetadataSnapshot>(metadataKey);
}

export function saveOfflineMetadataSnapshot(snapshot: OfflineMetadataSnapshot) {
  saveOfflineJson(metadataKey, snapshot);
}
