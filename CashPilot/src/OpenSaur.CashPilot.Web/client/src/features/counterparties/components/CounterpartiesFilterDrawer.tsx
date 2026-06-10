import { Stack } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { CheckBox } from "../../../components/atoms/CheckBox";
import { Text } from "../../../components/atoms/Text";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "../../../components/organisms/Drawer";
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
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={t("counterparties.filterTitle")}
    >
      <DrawerHeader />
      <DrawerBody
        component="form"
        id="counterparties-filter-form"
        noValidate
        onSubmit={form.handleSubmit(values => {
          onApply({
            ...values,
            email: values.email.trim(),
            fullName: values.fullName.trim(),
            phoneNumber: values.phoneNumber.trim()
          });
        })}
      >
        <Stack spacing={2}>
          <Text control={form.control} label={t("counterparties.fullName")} name="fullName" />
          <Text control={form.control} label={t("counterparties.email")} name="email" />
          <Text control={form.control} label={t("counterparties.phoneNumber")} name="phoneNumber" />
          <CheckBox control={form.control} label={t("common.activeOnly")} name="isActive" />
        </Stack>
      </DrawerBody>
      <DrawerFooter
        actions={[
          <ActionButton
            key="reset"
            type="button"
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
              {t("common.reset")}
            </ActionButton>,
          <ActionButton key="apply" form="counterparties-filter-form" type="submit">
            {t("common.apply")}
          </ActionButton>
        ]}
      />
    </Drawer>
  );
}

