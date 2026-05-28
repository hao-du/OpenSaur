import { useEffect, type ReactNode } from "react";
import { FormControl, Grid, Stack } from "@mui/material";
import { Controller, useFormContext, useWatch, type Control } from "react-hook-form";
import { Switch } from "../../../../components/atoms/Switch";
import { useSettings } from "../../../settings/provider/SettingProvider";
import type { TemplateFormValues } from "./TemplateForm";

export type ModePath =
  | `templateData.details.${number}.amount.autoPopulate`
  | `templateData.details.${number}.direction.autoPopulate`
  | `templateData.details.${number}.transactionDate.autoPopulate`
  | `templateData.details.${number}.description.autoPopulate`
  | "templateData.amount.autoPopulate"
  | "templateData.currencyId.autoPopulate"
  | "templateData.direction.autoPopulate"
  | "templateData.transactionDate.autoPopulate"
  | "templateData.description.autoPopulate"
  | "templateData.counterpartyId.autoPopulate"
  | "templateData.transferType.autoPopulate"
  | "templateData.status.autoPopulate"
  | "templateData.dueDate.autoPopulate"
  | "templateData.exchangeRate.autoPopulate"
  | "templateData.exchangeDate.autoPopulate"
  | "templateData.outAmount.autoPopulate"
  | "templateData.outCurrencyId.autoPopulate"
  | "templateData.inAmount.autoPopulate"
  | "templateData.inCurrencyId.autoPopulate"
  | "templateData.bankId.autoPopulate"
  | "templateData.accountNumber.autoPopulate"
  | "templateData.interestRate.autoPopulate"
  | "templateData.startDate.autoPopulate"
  | "templateData.maturityDate.autoPopulate";

function FieldModeSelector({ control, name }: { control: Control<TemplateFormValues>; name: ModePath }) {
  const { t } = useSettings();
  const { clearErrors, setValue, trigger } = useFormContext<TemplateFormValues>();
  const showUiName = name.replace(".autoPopulate", ".showUi");
  const valuePath = name.replace(".autoPopulate", ".value");
  const autoPopulateEnabled = Boolean(useWatch({ control, name: name as never }));
  const showUiEnabled = Boolean(useWatch({ control, name: showUiName as never }));

  useEffect(() => {
    clearErrors(valuePath as never);
    if (!autoPopulateEnabled) {
      if (!showUiEnabled) {
        setValue(showUiName as never, true as never, { shouldDirty: true, shouldValidate: false });
      }
    }
    queueMicrotask(() => {
      void trigger(valuePath as never);
    });
  }, [autoPopulateEnabled, clearErrors, setValue, showUiEnabled, showUiName, trigger, valuePath]);

  return (
    <Stack spacing={0.25}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <FormControl>
            <Stack alignItems="center" direction="row">
              <Switch
                checked={field.value === true}
                label={t("templates.autoPopulate")}
                onChange={checked => {
                  field.onChange(checked);
                  clearErrors(valuePath as never);
                  if (!checked) {
                    clearErrors(valuePath as never);
                    setValue(showUiName as never, true as never, { shouldDirty: true, shouldValidate: false });
                  }
                  queueMicrotask(() => {
                    void trigger(valuePath as never);
                  });
                }}
              />
            </Stack>
          </FormControl>
        )}
      />
      <Controller
        control={control}
        name={showUiName as never}
        render={({ field }) => (
          <FormControl>
            <Stack alignItems="center" direction="row">
              <Switch
                checked={field.value === true}
                label={t("templates.showUi")}
                disabled={!autoPopulateEnabled}
                onChange={checked => {
                  field.onChange(checked);
                  clearErrors(valuePath as never);
                  queueMicrotask(() => {
                    void trigger(valuePath as never);
                  });
                }}
              />
            </Stack>
          </FormControl>
        )}
      />
    </Stack>
  );
}

export function FieldRow({ children, control, modeName }: { children: ReactNode; control: Control<TemplateFormValues>; modeName: ModePath; }) {
  return (
    <Grid container spacing={1.25}>
      <Grid size={{ xs: 12, md: 8 }}>{children}</Grid>
      <Grid size={{ xs: 12, md: 4 }} sx={{ display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" } }}>
        <FieldModeSelector control={control} name={modeName} />
      </Grid>
    </Grid>
  );
}


