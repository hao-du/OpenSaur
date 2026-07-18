import type {
  BankAccountTemplateData,
  CashFlowTemplateData,
  ExchangeTemplateData,
  TemplateData,
  TemplateType,
  TransferTemplateData,
} from "../../dtos/TemplateDto";

type TemplateFieldNode = {
  autoPopulate?: boolean;
  showUi?: boolean;
  value?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  value != null && typeof value === "object" && !Array.isArray(value);

const parseTagsField = (field: TemplateFieldNode | undefined) => ({
  autoPopulate: field?.autoPopulate === true,
  showUi: field?.showUi === true,
  value: Array.isArray(field?.value) ? field.value : [],
});

const parseTemplateDetails = <T extends { details?: unknown[] }>(template: T) => ({
  ...template,
  details: Array.isArray(template.details) ? template.details : [],
});

function toUiTemplateNode(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(toUiTemplateNode);
  if (!isRecord(node)) return node;

  if (
    "value" in node &&
    ("autoPopulate" in node ||
      "populateMode" in node ||
      "showUI" in node ||
      "showUi" in node)
  ) {
    const autoPopulate =
      typeof node.autoPopulate === "boolean"
        ? node.autoPopulate
        : node.populateMode === "Auto";
    const showUi =
      typeof node.showUI === "boolean"
        ? node.showUI
        : typeof node.showUi === "boolean"
          ? node.showUi
          : false;
    return { value: node.value, autoPopulate, showUi };
  }

  const mapped: Record<string, unknown> = {};
  Object.entries(node).forEach(([k, v]) => {
    mapped[k] = toUiTemplateNode(v);
  });
  return mapped;
}

function toStoredTemplateNode(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(toStoredTemplateNode);
  if (!isRecord(node)) return node;

  if ("value" in node && "autoPopulate" in node) {
    return {
      value: node.value,
      autoPopulate: node.autoPopulate === true,
      showUI: node.showUi === true,
    };
  }

  const mapped: Record<string, unknown> = {};
  Object.entries(node).forEach(([k, v]) => {
    mapped[k] = toStoredTemplateNode(v);
  });
  return mapped;
}

export function buildDefaultTemplateData(type: TemplateType): TemplateData {
  const f = <T,>(value: T) => ({ autoPopulate: false, showUi: false, value });
  if (type === "CashFlow")
    return {
      amount: f(""),
      currencyId: f(""),
      description: f(""),
      direction: f("2"),
      transactionDate: f(""),
      tags: f<string[]>([]),
    } satisfies CashFlowTemplateData;
  if (type === "Transfer")
    return {
      amount: f(""),
      counterpartyId: f(""),
      currencyId: f(""),
      description: f(""),
      direction: f("1"),
      dueDate: f(""),
      status: f("1"),
      transactionDate: f(""),
      transferType: f("1"),
      details: [],
      tags: f<string[]>([]),
    } satisfies TransferTemplateData;
  if (type === "Exchange")
    return {
      description: f(""),
      exchangeDate: f(""),
      exchangeRate: f(""),
      inAmount: f(""),
      inCurrencyId: f(""),
      outAmount: f(""),
      outCurrencyId: f(""),
      tags: f<string[]>([]),
    };
  return {
    accountNumber: f(""),
    amount: f(""),
    bankId: f(""),
    currencyId: f(""),
    description: f(""),
    interestRate: f(""),
    maturityDate: f(""),
    startDate: f(""),
    status: f("1"),
    details: [],
    tags: f<string[]>([]),
  } satisfies BankAccountTemplateData;
}

export function safeParseTemplateData(
  raw: string,
  type: TemplateType,
): TemplateData {
  try {
    const parsed = JSON.parse(raw);
    if (parsed == null || typeof parsed !== "object")
      return buildDefaultTemplateData(type);
    const normalized = toUiTemplateNode(parsed) as Record<string, unknown>;
    if (type === "Transfer") {
      const transfer = normalized as TransferTemplateData;
      return {
        ...parseTemplateDetails(transfer),
        tags: parseTagsField(transfer.tags as TemplateFieldNode | undefined),
      };
    }
    if (type === "BankAccount") {
      const bank = normalized as BankAccountTemplateData;
      return {
        ...parseTemplateDetails(bank),
        tags: parseTagsField(bank.tags as TemplateFieldNode | undefined),
      };
    }
    if (type === "CashFlow") {
      const cashFlow = normalized as CashFlowTemplateData;
      return {
        ...cashFlow,
        tags: parseTagsField(cashFlow.tags as TemplateFieldNode | undefined),
      };
    }
    const exchange = normalized as ExchangeTemplateData;
    return {
      ...exchange,
      tags: parseTagsField(exchange.tags as TemplateFieldNode | undefined),
    };
  } catch {
    return buildDefaultTemplateData(type);
  }
}

export function toStoredTemplateData(templateData: TemplateData): unknown {
  return toStoredTemplateNode(templateData);
}
