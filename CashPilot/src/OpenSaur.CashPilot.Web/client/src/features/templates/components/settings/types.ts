import type { Control } from "react-hook-form";
import type { BankDto } from "../../../banks/dtos/BankDto";
import type { CounterpartyDto } from "../../../counterparties/dtos/CounterpartyDto";
import type { CurrencyDto } from "../../../currencies/dtos/CurrencyDto";
import type { TemplateFormValues } from "./TemplateForm";

export type OptionItem = {
  label: string;
  value: string;
};

export type TemplateSettingsFormProps = {
  control: Control<TemplateFormValues>;
  isSubmitting: boolean;
};

export type CashFlowTemplateFormProps = TemplateSettingsFormProps & {
  currencies: CurrencyDto[];
};

export type ExchangeTemplateFormProps = TemplateSettingsFormProps & {
  currencies: CurrencyDto[];
};

export type BankAccountTemplateFormProps = TemplateSettingsFormProps & {
  banks: BankDto[];
  currencies: CurrencyDto[];
};

export type TransferTemplateFormProps = TemplateSettingsFormProps & {
  counterparties: CounterpartyDto[];
  currencies: CurrencyDto[];
};
