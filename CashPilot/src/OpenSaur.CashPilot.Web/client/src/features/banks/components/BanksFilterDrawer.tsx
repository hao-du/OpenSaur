import { Stack } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { CheckBox } from "../../../components/atoms/CheckBox";
import { Text } from "../../../components/atoms/Text";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "../../../components/organisms/Drawer";
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
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={t("banks.filterTitle")}
      width="wide"
    >
      <DrawerHeader />
      <DrawerBody
        component="form"
        id="banks-filter-form"
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
        <Text control={form.control} label={t("common.name")} name="name" />
        <Text
          control={form.control}
          label={t("banks.shortName")}
          name="shortName"
        />
        <CheckBox control={form.control} label={t("common.activeOnly")} name="isActive" />
        </Stack>
      </DrawerBody>
      <DrawerFooter
        actions={[
          <ActionButton
            key="reset"
            onClick={() => {
              form.reset({
                isActive: true,
                name: "",
                shortName: ""
              });
            }}
            variant="outlined"
          >
            {t("common.reset")}
          </ActionButton>,
          <ActionButton key="apply" form="banks-filter-form" type="submit">
            {t("common.apply")}
          </ActionButton>
        ]}
      />
    </Drawer>
  );
}

