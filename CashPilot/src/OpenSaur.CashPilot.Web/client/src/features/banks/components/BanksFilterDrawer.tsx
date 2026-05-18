import { Stack } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { CheckBox } from "../../../components/atoms/CheckBox";
import { Text } from "../../../components/atoms/Text";
import { DrawerPanel } from "../../../components/organisms/DrawerPanel";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import { useSettings } from "../../settings/provider/SettingProvider";
import type { BankFilterParams } from "../api/banksApi";

type BanksFilterDrawerProps = {
  initialValues: BankFilterParams;
  isOpen: boolean;
  onApply: (values: BankFilterParams) => void;
  onClose: () => void;
};

export function BanksFilterDrawer({
  initialValues,
  isOpen,
  onApply,
  onClose
}: BanksFilterDrawerProps) {
  const { t } = useSettings();
  const form = useForm<BankFilterParams>({
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
      title={t("banks.filterTitle")}
    >
      <Stack
        component="form"
        noValidate
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
        <Text
          control={form.control}
          label={t("currencies.name")}
          name="name"
        />
        <Text
          control={form.control}
          label={t("banks.shortName")}
          name="shortName"
        />
        <CheckBox
          control={form.control}
          label={t("counterparties.activeOnly")}
          name="isActive"
        />
        <Stack direction="row" spacing={1} sx={layoutStyles.formFooterRow}>
          <ActionButton type="submit">
            {t("counterparties.apply")}
          </ActionButton>
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
            {t("counterparties.reset")}
          </ActionButton>
        </Stack>
      </Stack>
    </DrawerPanel>
  );
}

