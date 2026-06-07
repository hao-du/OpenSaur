import { Grid } from "@mui/material";
import type { Control } from "react-hook-form";
import { DatePicker } from "../../../components/atoms/DatePicker";
import { DropDown } from "../../../components/atoms/DropDown";
import { Number as NumberField } from "../../../components/atoms/Number";
import { TextArea } from "../../../components/atoms/TextArea";
import { TagAutocompleteMultiSelect } from "../../tags/components/TagAutocompleteMultiSelect";
import type { CounterpartyDto } from "../../counterparties/dtos/CounterpartyDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import { useSettings } from "../../settings/provider/SettingProvider";

export type TransferHeaderValues = {
  counterpartyId: string;
  transferType: string;
  status: string;
  currencyId: string;
  amount: string;
  transactionDate: string;
  dueDate: string;
  description: string;
  tags: string[];
};

type Props = {
  control: Control<TransferHeaderValues>;
  counterparties: CounterpartyDto[];
  currencies: CurrencyDto[];
  isSubmitting?: boolean;
};

export function TransferHeaderForm({
  control,
  counterparties,
  currencies,
  isSubmitting = false,
}: Props) {
  const { t } = useSettings();

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <DropDown
          control={control}
          disabled={isSubmitting}
          label={t("transactions.counterparty")}
          name="counterpartyId"
          options={counterparties.map((x) => ({ label: x.fullName, value: x.id }))}
          required
          rules={{ required: t("transactions.validation.counterpartyRequired") }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <DropDown
          control={control}
          disabled={isSubmitting}
          label={t("transactions.type")}
          name="transferType"
          options={[
            { label: t("transactions.transferType.lend"), value: "1" },
            { label: t("transactions.transferType.borrow"), value: "2" },
            { label: t("transactions.transferType.give"), value: "3" },
            { label: t("transactions.transferType.receive"), value: "4" },
          ]}
          required
          rules={{ required: t("transactions.validation.typeRequired") }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <DropDown
          control={control}
          disabled={isSubmitting}
          label={t("transactions.status")}
          name="status"
          options={[
            { label: t("transactions.statusType.active"), value: "1" },
            { label: t("transactions.statusType.completed"), value: "2" },
            { label: t("transactions.statusType.cancelled"), value: "3" },
          ]}
          required
          rules={{ required: t("transactions.validation.statusRequired") }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <NumberField
          control={control}
          disabled
          label={t("transactions.amount")}
          name="amount"
          required
          rules={{ required: t("transactions.validation.amountRequired") }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <DropDown
          control={control}
          disabled={isSubmitting}
          label={t("transactions.currency")}
          name="currencyId"
          options={currencies.map((x) => ({ label: x.shortName, value: x.id }))}
          required
          rules={{ required: t("transactions.validation.currencyRequired") }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <DatePicker
          control={control}
          disabled={isSubmitting}
          label={t("transactions.transactionDate")}
          name="transactionDate"
          required
          rules={{ required: t("transactions.validation.transactionDateRequired") }}
        />
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <DatePicker
          control={control}
          disabled={isSubmitting}
          label={t("transactions.dueDate")}
          name="dueDate"
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TextArea
          control={control}
          disabled={isSubmitting}
          label={t("transactions.description")}
          name="description"
          minRows={3}
        />
      </Grid>
      <Grid size={{ xs: 12 }}>
        <TagAutocompleteMultiSelect
          control={control}
          disabled={isSubmitting}
          label={t("tags.title")}
          name="tags"
        />
      </Grid>
    </Grid>
  );
}
