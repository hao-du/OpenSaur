import { Stack } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { CheckBox } from "../../../components/atoms/CheckBox";
import { Text } from "../../../components/atoms/Text";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "../../../components/organisms/Drawer";
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
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={t("currencies.filterTitle")}
    >
      <DrawerHeader />
      <DrawerBody
        component="form"
        id="currencies-filter-form"
        noValidate
        onSubmit={form.handleSubmit(values => {
          onApply({
            ...values,
            name: values.name.trim(),
            shortName: values.shortName.trim()
          });
        })}
      >
        <Stack spacing={2}>
          <Text control={form.control} label={t("currencies.name")} name="name" />
          <Text control={form.control} label={t("currencies.shortCode")} name="shortName" />
          <CheckBox control={form.control} label={t("common.activeOnly")} name="isActive" />
        </Stack>
      </DrawerBody>
      <DrawerFooter
        actions={[
          <ActionButton key="reset" type="button" variant="outlined" onClick={() => {
            form.reset({
              isActive: true,
              name: "",
              shortName: ""
            });
          }}>
            {t("common.reset")}
          </ActionButton>,
          <ActionButton key="apply" form="currencies-filter-form" type="submit">
            {t("common.apply")}
          </ActionButton>
        ]}
      />
    </Drawer>
  );
}

