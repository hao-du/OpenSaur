import type { BankDto } from "../../banks/dtos/BankDto";
import type { CounterpartyDto } from "../../counterparties/dtos/CounterpartyDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import type {
  CashFlowDetailDto,
  SaveBankAccountFormRequestDto,
  SaveTransferFormRequestDto,
  TransactionListItemDto,
} from "../../transactions/dtos/TransactionDto";
import type { OfflineTransactionRecord } from "../storages/offlineTransactionsStore";
import type { TemplateDetailDto, TemplateType } from "../../templates/dtos/TemplateDto";
import type { TemplateData } from "../../templates/dtos/TemplateDto";
import { safeParseTemplateData } from "../../templates/components/settings/TemplateDataCodec";
import {
  initialDateValue,
  initialTagsValue,
  initialValue,
} from "../../templates/components/populate/utils";
import { bankAccountStatuses, transactionDirectionValues } from "../../../infrastructure/constants/transactionEnums";

export function templateTypeNumberToTransactionType(templateType: number): TemplateType {
  if (templateType === 1) return "CashFlow";
  if (templateType === 2) return "Transfer";
  if (templateType === 3) return "Exchange";
  return "BankAccount";
}

export function parseTemplateData(template: TemplateDetailDto): TemplateData {
  return safeParseTemplateData(template.templateDataJson, templateTypeNumberToTransactionType(template.templateType));
}

export function buildCashFlowInitialValue(
  templateData: TemplateData | null | undefined,
  currencies: CurrencyDto[],
  todayIsoDate: string,
  record?: OfflineTransactionRecord | null,
): CashFlowDetailDto | null {
  if (record != null && record.payloadJson.length > 0) {
    try {
      return JSON.parse(record.payloadJson) as CashFlowDetailDto;
    } catch {
      // fall through to template/default values
    }
  }

  if (
    templateData == null ||
    !("amount" in templateData) ||
    !("currencyId" in templateData) ||
    !("transactionDate" in templateData) ||
    !("direction" in templateData)
  ) {
    return null;
  }

  return {
    amount: Number(initialValue(templateData.amount, todayIsoDate) || "0"),
    currencyId: initialValue(templateData.currencyId, todayIsoDate) || (currencies[0]?.id ?? ""),
    description: initialValue(templateData.description, todayIsoDate) || null,
    id: record?.id ?? crypto.randomUUID(),
    isActive: record?.isActive ?? true,
    tags: initialTagsValue(templateData.tags),
    transactionDate: initialDateValue(templateData.transactionDate, todayIsoDate) || todayIsoDate,
    transactionItems: [],
    direction: Number(initialValue(templateData.direction, todayIsoDate) || String(transactionDirectionValues.outflow)),
  };
}

export function buildBankAccountInitialValue(
  templateData: TemplateData | null | undefined,
  banks: BankDto[],
  currencies: CurrencyDto[],
  todayIsoDate: string,
  record?: OfflineTransactionRecord | null,
): SaveBankAccountFormRequestDto | null {
  if (record != null && record.payloadJson.length > 0) {
    try {
      return JSON.parse(record.payloadJson) as SaveBankAccountFormRequestDto;
    } catch {
      // fall through to template/default values
    }
  }

  if (templateData == null || !("bankId" in templateData)) {
    return null;
  }

  return {
    accountNumber: initialValue(templateData.accountNumber, todayIsoDate) || undefined,
    amount: Number(initialValue(templateData.amount, todayIsoDate) || "0"),
    bankId: initialValue(templateData.bankId, todayIsoDate) || (banks[0]?.id ?? ""),
    currencyId: initialValue(templateData.currencyId, todayIsoDate) || (currencies[0]?.id ?? ""),
    description: initialValue(templateData.description, todayIsoDate) || undefined,
    details: [],
    id: record?.id,
    interestRate: Number(initialValue(templateData.interestRate, todayIsoDate) || "0"),
    isActive: record?.isActive ?? true,
    maturityDate: initialDateValue(templateData.maturityDate, todayIsoDate) || undefined,
    startDate: initialDateValue(templateData.startDate, todayIsoDate) || todayIsoDate,
    status: Number(initialValue(templateData.status, todayIsoDate) || String(bankAccountStatuses.active)),
    tags: initialTagsValue(templateData.tags),
    transactionItems: [],
  };
}

export function buildTransferInitialValue(
  templateData: TemplateData | null | undefined,
  counterparties: CounterpartyDto[],
  currencies: CurrencyDto[],
  todayIsoDate: string,
  record?: OfflineTransactionRecord | null,
): {
  movementInitialValue: {
    id: string;
    counterpartyId: string;
    transferType: number;
    status: number;
    currencyId: string;
    amount: number;
    transactionDate: string;
    dueDate?: string | null;
    description?: string | null;
    tags?: string[] | null;
  } | null;
  movementInitialDetails: Array<{
    id: string;
    currencyId: string;
    amount: number;
    direction: number;
    transactionDate: string;
    description?: string | null;
    isActive: boolean;
  }>;
  movementInitialTransactionItems: Array<{ id?: string; name: string; amount: number }>;
} {
  if (record != null && record.payloadJson.length > 0) {
    try {
      const parsed = JSON.parse(record.payloadJson) as SaveTransferFormRequestDto;
      return {
        movementInitialValue: {
          amount: parsed.amount,
          counterpartyId: parsed.counterpartyId,
          currencyId: parsed.currencyId,
          description: parsed.description ?? null,
          dueDate: parsed.dueDate ?? null,
          id: parsed.id ?? record.id,
          status: parsed.status,
          tags: parsed.tags ?? null,
          transactionDate: parsed.transactionDate,
          transferType: parsed.transferType,
        },
        movementInitialDetails: (parsed.details ?? []).map((detail) => ({
          amount: detail.amount,
          currencyId: detail.currencyId,
          description: detail.description ?? null,
          direction: detail.direction,
          id: detail.id ?? crypto.randomUUID(),
          isActive: detail.isActive,
          transactionDate: detail.transactionDate,
        })),
        movementInitialTransactionItems: (parsed.transactionItems ?? []).map((item) => ({
          amount: item.amount,
          id: item.id,
          name: item.name,
        })),
      };
    } catch {
      // fall through to template/default values
    }
  }

  if (templateData == null || !("counterpartyId" in templateData)) {
    return {
      movementInitialDetails: [],
      movementInitialTransactionItems: [],
      movementInitialValue: null,
    };
  }

  return {
    movementInitialValue: {
      amount: Number(initialValue(templateData.amount, todayIsoDate) || "0"),
      counterpartyId: initialValue(templateData.counterpartyId, todayIsoDate) || (counterparties[0]?.id ?? ""),
      currencyId: initialValue(templateData.currencyId, todayIsoDate) || (currencies[0]?.id ?? ""),
      description: initialValue(templateData.description, todayIsoDate) || null,
      dueDate: initialDateValue(templateData.dueDate, todayIsoDate) || null,
      id: record?.id ?? crypto.randomUUID(),
      status: Number(initialValue(templateData.status, todayIsoDate) || "1"),
      tags: initialTagsValue(templateData.tags),
      transactionDate: initialDateValue(templateData.transactionDate, todayIsoDate) || todayIsoDate,
      transferType: Number(initialValue(templateData.transferType, todayIsoDate) || "1"),
    },
    movementInitialDetails: [],
    movementInitialTransactionItems: [],
  };
}

export function buildExchangeInitialValue(
  templateData: TemplateData | null | undefined,
  currencies: CurrencyDto[],
  todayIsoDate: string,
  record?: OfflineTransactionRecord | null,
): {
  description?: string | null;
  exchangeDate: string;
  exchangeRate: number | null;
  id: string;
  inAmount: number;
  inCurrencyId: string;
  isActive: boolean;
  outAmount: number;
  outCurrencyId: string;
  tags?: string[] | null;
  transactionItems?: Array<{ id?: string; name: string; amount: number }>;
} | null {
  if (record != null && record.payloadJson.length > 0) {
    try {
      return JSON.parse(record.payloadJson) as {
        description?: string | null;
        exchangeDate: string;
        exchangeRate: number | null;
        id: string;
        inAmount: number;
        inCurrencyId: string;
        isActive: boolean;
        outAmount: number;
        outCurrencyId: string;
        tags?: string[] | null;
        transactionItems?: Array<{ id?: string; name: string; amount: number }>;
      };
    } catch {
      // fall through to template/default values
    }
  }

  if (templateData == null || !("exchangeDate" in templateData)) {
    return null;
  }

  return {
    description: initialValue(templateData.description, todayIsoDate) || null,
    exchangeDate: initialDateValue(templateData.exchangeDate, todayIsoDate) || todayIsoDate,
    exchangeRate: Number(initialValue(templateData.exchangeRate, todayIsoDate) || "0"),
    id: record?.id ?? crypto.randomUUID(),
    inAmount: Number(initialValue(templateData.inAmount, todayIsoDate) || "0"),
    inCurrencyId: initialValue(templateData.inCurrencyId, todayIsoDate) || (currencies[0]?.id ?? ""),
    isActive: record?.isActive ?? true,
    outAmount: Number(initialValue(templateData.outAmount, todayIsoDate) || "0"),
    outCurrencyId: initialValue(templateData.outCurrencyId, todayIsoDate) || (currencies[0]?.id ?? ""),
    tags: initialTagsValue(templateData.tags),
    transactionItems: [],
  };
}

export function buildTransactionListItem(record: OfflineTransactionRecord): TransactionListItemDto {
  return {
    amount: record.amount,
    bankAccountId: record.type === "BankAccount" ? record.id : null,
    bankAccountStatus: record.bankAccountStatus ?? null,
    bankAccountTransactionType: record.bankAccountTransactionType ?? null,
    bankName: record.bankName ?? null,
    counterpartyName: record.counterpartyName ?? null,
    description: record.description.length > 0 ? record.description : null,
    direction: record.direction ?? (record.type === "Exchange" ? transactionDirectionValues.outflow : transactionDirectionValues.inflow),
    exchangeId: record.type === "Exchange" ? record.id : null,
    id: record.id,
    isActive: record.isActive,
    tags: record.tags,
    transactionDate: record.transactionDate,
    transferId: record.type === "Transfer" ? record.transferId ?? record.id : null,
    transferStatus: record.transferStatus ?? null,
    transferType: record.transferType ?? null,
    type: record.type,
    currencyCode: record.currencyCode,
  };
}

export function createOfflineTransactionRecord(
  transaction: TransactionListItemDto,
  payloadJson: string,
): OfflineTransactionRecord {
  return {
    amount: transaction.amount,
    bankAccountStatus: transaction.bankAccountStatus,
    bankAccountTransactionType: transaction.bankAccountTransactionType,
    bankName: transaction.bankName,
    counterpartyName: transaction.counterpartyName,
    direction: transaction.direction,
    currencyCode: transaction.currencyCode,
    description: transaction.description ?? "",
    exchangeId: transaction.exchangeId,
    id: transaction.id,
    isActive: transaction.isActive,
    payloadJson,
    tags: transaction.tags ?? [],
    transactionDate: transaction.transactionDate,
    transferId: transaction.transferId,
    transferStatus: transaction.transferStatus,
    transferType: transaction.transferType,
    type: transaction.type,
    updatedAt: new Date().toISOString(),
  };
}
