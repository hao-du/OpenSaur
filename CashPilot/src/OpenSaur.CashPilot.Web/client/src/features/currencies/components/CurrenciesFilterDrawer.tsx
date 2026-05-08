import { Stack } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { CheckBox } from "../../../components/atoms/CheckBox";
import { Text } from "../../../components/atoms/Text";
import { DrawerPanel } from "../../../components/organisms/DrawerPanel";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import { useSettings } from "../../settings/provider/SettingProvider";
import type { CurrencyFilterParams } from "../api/currenciesApi";

type CurrenciesFilterDrawerProps = {
  initialValues: CurrencyFilterParams;
  isOpen: boolean;
  onApply: (values: CurrencyFilterParams) => void;
  onClose: () => void;
};

export function CurrenciesFilterDrawer({
  initialValues,
  isOpen,
  onApply,
  onClose
}: CurrenciesFilterDrawerProps) {
  const { t } = useSettings();
  const form = useForm<CurrencyFilterParams>({
    defaultValues: initialValues
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    form.reset(initialValues);
  }, [form, initialValues, isOpen]);

  return (
    <DrawerPanel
      isOpen={isOpen}
      onClose={onClose}
      title={t("currencies.filterTitle")}
    >
      <Stack
        component="form"
        onSubmit={form.handleSubmit(values => {
          onApply({
            ...values,
            name: values.name.trim(),
            shortName: values.shortName.trim()
          });
        })}
        spacing={2}
        sx={layoutStyles.drawerBody}
      >
        <Text control={form.control} label={t("currencies.name")} name="name" />
        <Text control={form.control} label={t("currencies.shortCode")} name="shortName" />
        <CheckBox control={form.control} label={t("currencies.activeOnly")} name="isActive" />
        <Stack direction="row" spacing={1} sx={layoutStyles.formFooterRow}>
          <ActionButton type="submit">{t("currencies.apply")}</ActionButton>
          <ActionButton
            onClick={() => {
              form.reset({
                isActive: true,
                name: "",
                shortName: ""
              });
            }}
            variant="outlined"
          >
            {t("currencies.reset")}
          </ActionButton>
        </Stack>
      </Stack>
    </DrawerPanel>
  );
}
