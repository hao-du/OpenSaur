import { Stack } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { CheckBox } from "../../../components/atoms/CheckBox";
import { Text } from "../../../components/atoms/Text";
import { DrawerPanel } from "../../../components/organisms/DrawerPanel";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import type { CounterpartyFilterParams } from "../api/counterpartiesApi";
import { useSettings } from "../../settings/provider/SettingProvider";

type CounterpartiesFilterDrawerProps = {
  initialValues: CounterpartyFilterParams;
  isOpen: boolean;
  onApply: (values: CounterpartyFilterParams) => void;
  onClose: () => void;
};

export function CounterpartiesFilterDrawer({
  initialValues,
  isOpen,
  onApply,
  onClose
}: CounterpartiesFilterDrawerProps) {
  const { t } = useSettings();
  const form = useForm<CounterpartyFilterParams>({
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
      title={t("counterparties.filterTitle")}
    >
      <Stack
        component="form"
        onSubmit={form.handleSubmit(values => {
          onApply({
            ...values,
            email: values.email.trim(),
            fullName: values.fullName.trim(),
            phoneNumber: values.phoneNumber.trim()
          });
        })}
        spacing={2}
        sx={layoutStyles.drawerBody}
      >
        <Text control={form.control} label={t("counterparties.fullName")} name="fullName" />
        <Text control={form.control} label={t("counterparties.email")} name="email" />
        <Text control={form.control} label={t("counterparties.phoneNumber")} name="phoneNumber" />
        <CheckBox control={form.control} label={t("counterparties.activeOnly")} name="isActive" />
        <Stack direction="row" spacing={1} sx={layoutStyles.formFooterRow}>
          <ActionButton type="submit">{t("counterparties.apply")}</ActionButton>
          <ActionButton
            onClick={() => {
              form.reset({
                email: "",
                fullName: "",
                isActive: true,
                phoneNumber: ""
              });
            }}
            variant="outlined"
          >
            {t("counterparties.reset")}
          </ActionButton>
        </Stack>
      </Stack>
    </DrawerPanel>
  );
}
