import { Stack } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { CheckBox } from "../../../components/atoms/CheckBox";
import { DropDown } from "../../../components/atoms/DropDown";
import { Text } from "../../../components/atoms/Text";
import { DrawerPanel } from "../../../components/organisms/DrawerPanel";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import { useSettings } from "../../settings/provider/SettingProvider";
import type { TemplateFilterParams } from "../dtos/TemplateDto";

type Props = {
  initialValues: TemplateFilterParams;
  isOpen: boolean;
  onApply: (values: TemplateFilterParams) => void;
  onClose: () => void;
};

export function TemplatesFilterDrawer({ initialValues, isOpen, onApply, onClose }: Props) {
  const { t } = useSettings();
  const form = useForm<TemplateFilterParams>({ defaultValues: initialValues });

  useEffect(() => {
    if (isOpen) {
      form.reset(initialValues);
    }
  }, [form, initialValues, isOpen]);

  return (
    <DrawerPanel isOpen={isOpen} onClose={onClose} title={t("templates.filterTitle")}>
      <Stack component="form" onSubmit={form.handleSubmit(onApply)} spacing={2} sx={layoutStyles.drawerBody}>
        <Text control={form.control} label={t("common.name")} name="name" />
        <DropDown
          control={form.control}
          label={t("templates.templateType")}
          name="templateType"
          options={[
            { label: t("common.none"), value: "" },
            { label: t("templates.templateType.cashFlow"), value: "CashFlow" },
            { label: t("templates.templateType.transfer"), value: "Transfer" },
            { label: t("templates.templateType.exchange"), value: "Exchange" },
            { label: t("templates.templateType.bankAccount"), value: "BankAccount" }
          ]}
        />
        <CheckBox control={form.control} label={t("common.activeOnly")} name="isActive" />
        <Stack direction="row" spacing={1} sx={layoutStyles.formFooterRow}>
          <ActionButton type="submit">{t("common.apply")}</ActionButton>
          <ActionButton onClick={() => {
            form.reset({ isActive: true, name: "", templateType: "" });
          }} type="button" variant="outlined">{t("common.reset")}</ActionButton>
        </Stack>
      </Stack>
    </DrawerPanel>
  );
}

