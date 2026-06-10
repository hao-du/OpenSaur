import { Divider, Stack } from "@mui/material";
import { Controller, type Control } from "react-hook-form";
import { Text } from "../../../../components/atoms/Text";
import { TextArea } from "../../../../components/atoms/TextArea";
import { useSettings } from "../../../settings/provider/SettingProvider";
import { TagAutocompleteMultiSelect } from "../../../tags/components/TagAutocompleteMultiSelect";
import type { BankDto } from "../../../banks/dtos/BankDto";
import type { CounterpartyDto } from "../../../counterparties/dtos/CounterpartyDto";
import type { CurrencyDto } from "../../../currencies/dtos/CurrencyDto";
import type {
  TemplateData,
  TemplateType,
} from "../../dtos/TemplateDto";
import { BankAccountTemplateForm } from "./BankAccountTemplateForm";
import { CashFlowTemplateForm } from "./CashFlowTemplateForm";
import { ExchangeTemplateForm } from "./ExchangeTemplateForm";
import { FieldRow } from "./TemplateFormShared";
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
  banks: BankDto[];
  counterparties: CounterpartyDto[];
  currencies: CurrencyDto[];
};

export function TemplateForm({
  banks,
  control,
  counterparties,
  currencies,
  isSubmitting,
}: Props) {
  const { t } = useSettings();

  return (
    <Stack spacing={2}>
      <Text
        control={control}
        disabled={isSubmitting}
        label={t("templates.name")}
        name="name"
        required
        rules={{ required: t("templates.validation.nameRequired") }}
      />
      <TextArea
        control={control}
        disabled={isSubmitting}
        label={t("templates.description")}
        minRows={2}
        name="description"
      />
      <Divider />
      <Controller
        control={control}
        name="templateType"
        render={({ field }) => {
          if (field.value === "CashFlow")
            return (
              <CashFlowTemplateForm
                control={control}
                currencies={currencies}
                isSubmitting={isSubmitting}
              />
            );
          if (field.value === "Transfer")
            return (
              <TransferTemplateForm
                control={control}
                counterparties={counterparties}
                currencies={currencies}
                isSubmitting={isSubmitting}
              />
            );
          if (field.value === "Exchange")
            return (
              <ExchangeTemplateForm
                control={control}
                currencies={currencies}
                isSubmitting={isSubmitting}
              />
            );
          return (
            <BankAccountTemplateForm
              banks={banks}
              control={control}
              currencies={currencies}
              isSubmitting={isSubmitting}
            />
          );
        }}
      />
      <FieldRow control={control} modeName="templateData.tags.autoPopulate">
        <TagAutocompleteMultiSelect
          control={control}
          label={t("tags.title")}
          name="templateData.tags.value"
        />
      </FieldRow>
    </Stack>
  );
}
