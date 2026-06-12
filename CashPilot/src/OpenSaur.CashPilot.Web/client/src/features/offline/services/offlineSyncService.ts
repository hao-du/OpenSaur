import { getBanks } from "../../banks/api/banksApi";
import { getCounterparties } from "../../counterparties/api/counterpartiesApi";
import { getCurrencies } from "../../currencies/api/currenciesApi";
import { getTags } from "../../tags/api/tagsApi";
import { getTemplates } from "../../templates/api/templatesApi";
import { client } from "../../../infrastructure/http/client";
import { loadCurrentProfile } from "../../profile/storages/currentProfileStore";
import type { OfflineMetadataSnapshot } from "../storages/offlineMetadataStore";
import { saveOfflineMetadataSnapshot } from "../storages/offlineMetadataStore";
import { loadOfflineTemplates, saveOfflineTemplates } from "../storages/offlineTemplatesStore";
import { loadOfflineTransactions, removeOfflineTransaction } from "../storages/offlineTransactionsStore";
import type {
  CreateCashFlowRequestDto,
  CreateCurrencyExchangeRequestDto,
  SaveBankAccountFormRequestDto,
  SaveTransferFormRequestDto,
} from "../../transactions/dtos/TransactionDto";
import type { OfflineTransactionRecord } from "../storages/offlineTransactionsStore";

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
  } else {
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
  }
  return snapshot;
}

export async function syncOfflineTransactions() {
  const currentProfile = loadCurrentProfile();
  const currentUserId = currentProfile?.id;
  const transactions = currentUserId == null
    ? []
    : loadOfflineTransactions().filter((transaction) => transaction.userId == null || transaction.userId === currentUserId);
  const results = {
    failed: 0,
    synced: 0,
  };

  for (const transaction of transactions) {
    try {
      await syncTransaction(transaction);
      removeOfflineTransaction(transaction.id);
      results.synced += 1;
    } catch {
      results.failed += 1;
    }
  }

  return results;
}

async function syncTransaction(transaction: OfflineTransactionRecord) {
  switch (transaction.type) {
    case "CashFlow": {
      const payload = JSON.parse(transaction.payloadJson) as CreateCashFlowRequestDto;
      const { amount, currencyId, direction, description, tags, transactionItems, transactionDate } = payload;
      await client.post<string, CreateCashFlowRequestDto>("/api/transactions/cashflows/create", {
        amount,
        currencyId,
        description,
        direction,
        tags,
        transactionDate,
        transactionItems,
      });
      return;
    }
    case "BankAccount": {
      const payload = JSON.parse(transaction.payloadJson) as SaveBankAccountFormRequestDto;
      const { id: _, ...request } = payload;
      await client.post<string, SaveBankAccountFormRequestDto>("/api/transactions/bankaccounts/create", request);
      return;
    }
    case "Transfer": {
      const payload = JSON.parse(transaction.payloadJson) as SaveTransferFormRequestDto;
      const { id: _, ...request } = payload;
      await client.post<string, SaveTransferFormRequestDto>("/api/transactions/transfers/create", request);
      return;
    }
    case "Exchange": {
      const payload = parseExchangePayload(transaction.payloadJson);
      await client.post<string, CreateCurrencyExchangeRequestDto>("/api/transactions/exchanges/create", payload);
      return;
    }
    default:
      throw new Error(`Unsupported transaction type: ${transaction.type}`);
  }
}

function parseExchangePayload(payloadJson: string): CreateCurrencyExchangeRequestDto {
  const parsed = JSON.parse(payloadJson) as
    | CreateCurrencyExchangeRequestDto
    | {
        description?: string | null;
        exchangeDate: string;
        exchangeRate?: number;
        id?: string;
        inAmount: number;
        inCurrencyId: string;
        isActive?: boolean;
        outAmount: number;
        outCurrencyId: string;
        tags: string[];
        transactionItems: CreateCurrencyExchangeRequestDto["transactionItems"];
      };

  if ("outLeg" in parsed && "inLeg" in parsed) {
    return parsed;
  }

  return {
    description: parsed.description ?? undefined,
    exchangeDate: parsed.exchangeDate,
    exchangeRate: parsed.exchangeRate,
    inLeg: {
      amount: parsed.inAmount,
      currencyId: parsed.inCurrencyId,
      description: parsed.description ?? undefined,
    },
    outLeg: {
      amount: parsed.outAmount,
      currencyId: parsed.outCurrencyId,
      description: parsed.description ?? undefined,
    },
    tags: parsed.tags ?? [],
    transactionItems: parsed.transactionItems ?? [],
  };
}
