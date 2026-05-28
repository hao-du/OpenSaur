import { Divider, Stack } from "@mui/material";
import { Controller, type Control } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { Text } from "../../../components/atoms/Text";
import { TextArea } from "../../../components/atoms/TextArea";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import { useSettings } from "../../settings/provider/SettingProvider";
import type { BankDto } from "../../banks/dtos/BankDto";
import type { CounterpartyDto } from "../../counterparties/dtos/CounterpartyDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import type { BankAccountTemplateData, CashFlowTemplateData, TemplateData, TemplateType, TransferTemplateData } from "../dtos/TemplateDto";
import { BankAccountTemplateForm } from "./BankAccountTemplateForm";
import { CashFlowTemplateForm } from "./CashFlowTemplateForm";
import { ExchangeTemplateForm } from "./ExchangeTemplateForm";
import { TransferTemplateForm } from "./TransferTemplateForm";

export type TemplateFormValues = {
  name: string;
  description: string;
  templateType: TemplateType;
  templateData: TemplateData;
};

type Props = {
  control: Control<TemplateFormValues>;
  isSubmitting: boolean;
  submitLabel: string;
  banks: BankDto[];
  counterparties: CounterpartyDto[];
  currencies: CurrencyDto[];
};

function toUiTemplateNode(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(toUiTemplateNode);
  if (node == null || typeof node !== "object") return node;

  const record = node as Record<string, unknown>;
  if ("value" in record && ("autoPopulate" in record || "populateMode" in record || "showUI" in record || "showUi" in record)) {
    const autoPopulate = typeof record.autoPopulate === "boolean"
      ? record.autoPopulate
      : record.populateMode === "Auto";
    const showUi = typeof record.showUI === "boolean"
      ? record.showUI
      : typeof record.showUi === "boolean"
        ? record.showUi
        : false;
    return { value: record.value, autoPopulate, showUi };
  }

  const mapped: Record<string, unknown> = {};
  Object.entries(record).forEach(([k, v]) => { mapped[k] = toUiTemplateNode(v); });
  return mapped;
}

function toStoredTemplateNode(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(toStoredTemplateNode);
  if (node == null || typeof node !== "object") return node;

  const record = node as Record<string, unknown>;
  if ("value" in record && "autoPopulate" in record) {
    return {
      value: record.value,
      autoPopulate: record.autoPopulate === true,
      showUI: record.showUi === true
    };
  }

  const mapped: Record<string, unknown> = {};
  Object.entries(record).forEach(([k, v]) => { mapped[k] = toStoredTemplateNode(v); });
  return mapped;
}

export function buildDefaultTemplateData(type: TemplateType): TemplateData {
  const f = (value: string) => ({ autoPopulate: false, showUi: false, value });
  if (type === "CashFlow") return { amount: f(""), currencyId: f(""), description: f(""), direction: f("2"), transactionDate: f("") } satisfies CashFlowTemplateData;
  if (type === "Transfer") return { amount: f(""), counterpartyId: f(""), currencyId: f(""), description: f(""), direction: f("1"), dueDate: f(""), status: f("1"), transactionDate: f(""), transferType: f("1"), details: [] } satisfies TransferTemplateData;
  if (type === "Exchange") return { description: f(""), exchangeDate: f(""), exchangeRate: f(""), inAmount: f(""), inCurrencyId: f(""), outAmount: f(""), outCurrencyId: f("") };
  return { accountNumber: f(""), amount: f(""), bankId: f(""), currencyId: f(""), description: f(""), interestRate: f(""), maturityDate: f(""), movementType: f("1"), startDate: f(""), status: f("1"), details: [] } satisfies BankAccountTemplateData;
}

export function safeParseTemplateData(raw: string, type: TemplateType): TemplateData {
  try {
    const parsed = JSON.parse(raw);
    if (parsed == null || typeof parsed !== "object") return buildDefaultTemplateData(type);
    const normalized = toUiTemplateNode(parsed) as Record<string, unknown>;
    if (type === "Transfer") {
      const transfer = normalized as TransferTemplateData;
      return { ...transfer, details: Array.isArray(transfer.details) ? transfer.details : [] };
    }
    if (type === "BankAccount") {
      const bank = normalized as BankAccountTemplateData;
      return { ...bank, details: Array.isArray(bank.details) ? bank.details : [] };
    }
    return normalized as TemplateData;
  } catch {
    return buildDefaultTemplateData(type);
  }
}

export function toStoredTemplateData(templateData: TemplateData): unknown {
  return toStoredTemplateNode(templateData);
}

export function TemplateForm({ banks, control, counterparties, currencies, isSubmitting, submitLabel }: Props) {
  const { t } = useSettings();

  return (
    <Stack spacing={2} sx={layoutStyles.drawerBody}>
      <Text control={control} disabled={isSubmitting} label={t("currencies.name")} name="name" required rules={{ required: t("templates.validation.nameRequired") }} />
      <TextArea control={control} disabled={isSubmitting} label={t("currencies.description")} minRows={2} name="description" />
      <Divider />
      <Controller
        control={control}
        name="templateType"
        render={({ field }) => {
          if (field.value === "CashFlow") return <CashFlowTemplateForm control={control} currencies={currencies} isSubmitting={isSubmitting} />;
          if (field.value === "Transfer") return <TransferTemplateForm control={control} counterparties={counterparties} currencies={currencies} isSubmitting={isSubmitting} />;
          if (field.value === "Exchange") return <ExchangeTemplateForm control={control} currencies={currencies} isSubmitting={isSubmitting} />;
          return <BankAccountTemplateForm banks={banks} control={control} currencies={currencies} isSubmitting={isSubmitting} />;
        }}
      />
      <Stack direction="row" justifyContent="flex-end" spacing={1} sx={layoutStyles.formFooterRow}>
        <ActionButton disabled={isSubmitting} type="submit">{isSubmitting ? t("action.working") : submitLabel}</ActionButton>
      </Stack>
    </Stack>
  );
}
