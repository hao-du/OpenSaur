import { useEffect, type ReactNode } from "react";
import { FormControl, Grid, Stack } from "@mui/material";
import {
  Controller,
  useFormContext,
  useWatch,
  type Control,
} from "react-hook-form";
import { Switch } from "../../../../components/atoms/Switch";
import { useSettings } from "../../../settings/provider/SettingProvider";
import type { TemplateFormValues } from "./TemplateForm";

export type ModePath =
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

function FieldModeSelector({
  allowManualHide = false,
  control,
  name,
}: {
  allowManualHide?: boolean;
  control: Control<TemplateFormValues>;
  name: ModePath;
}) {
  const { t } = useSettings();
  const { clearErrors, setValue, trigger } =
    useFormContext<TemplateFormValues>();
  const showUiName = name.replace(".autoPopulate", ".showUi");
  const valuePath = name.replace(".autoPopulate", ".value");
  const autoPopulateEnabled = Boolean(
    useWatch({ control, name: name as never }),
  );
  const showUiEnabled = Boolean(
    useWatch({ control, name: showUiName as never }),
  );
  const clearAndTriggerValue = () => {
    clearErrors(valuePath as never);
    queueMicrotask(() => {
      void trigger(valuePath as never);
    });
  };

  useEffect(() => {
    clearAndTriggerValue();
    if (!allowManualHide && !autoPopulateEnabled && !showUiEnabled) {
      setValue(showUiName as never, true as never, {
        shouldDirty: true,
        shouldValidate: false,
      });
    }
  }, [
    autoPopulateEnabled,
    allowManualHide,
    clearErrors,
    setValue,
    showUiEnabled,
    showUiName,
    trigger,
    valuePath,
  ]);

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
                onChange={(checked) => {
                  field.onChange(checked);
                  if (!allowManualHide && !checked) {
                    setValue(showUiName as never, true as never, {
                      shouldDirty: true,
                      shouldValidate: false,
                    });
                  }
                  clearAndTriggerValue();
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
                disabled={!allowManualHide && !autoPopulateEnabled}
                onChange={(checked) => {
                  field.onChange(checked);
                  clearAndTriggerValue();
                }}
              />
            </Stack>
          </FormControl>
        )}
      />
    </Stack>
  );
}

export function FieldRow({
  allowManualHide = false,
  children,
  control,
  modeName,
}: {
  allowManualHide?: boolean;
  children: ReactNode;
  control: Control<TemplateFormValues>;
  modeName: ModePath;
}) {
  return (
    <Grid container spacing={1.25}>
      <Grid size={{ xs: 12, md: 8 }}>{children}</Grid>
      <Grid
        size={{ xs: 12, md: 4 }}
        sx={{
          display: "flex",
          justifyContent: { xs: "flex-start", md: "flex-end" },
        }}
      >
        <FieldModeSelector
          allowManualHide={allowManualHide}
          control={control}
          name={modeName}
        />
      </Grid>
    </Grid>
  );
}
