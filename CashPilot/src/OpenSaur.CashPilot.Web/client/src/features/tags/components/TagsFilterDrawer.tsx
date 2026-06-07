import { Stack } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { CheckBox } from "../../../components/atoms/CheckBox";
import { Text } from "../../../components/atoms/Text";
import { DrawerPanel } from "../../../components/organisms/DrawerPanel";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import { useSettings } from "../../settings/provider/SettingProvider";
import type { TagFilterParams } from "../api/tagsApi";

type TagsFilterDrawerProps = {
  initialValues: TagFilterParams;
  isOpen: boolean;
  onApply: (values: TagFilterParams) => void;
  onClose: () => void;
};

export function TagsFilterDrawer({ initialValues, isOpen, onApply, onClose }: TagsFilterDrawerProps) {
  const { t } = useSettings();
  const form = useForm<TagFilterParams>({
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
      title={t("tags.filterTitle")}
    >
      <Stack
        component="form"
        noValidate
        onSubmit={form.handleSubmit(values => {
          onApply({
            ...values,
            name: values.name.trim()
          });
        })}
        spacing={2}
        sx={layoutStyles.drawerBody}
      >
        <Text
          control={form.control}
          label={t("tags.name")}
          name="name"
        />
        <CheckBox
          control={form.control}
          label={t("common.activeOnly")}
          name="isActive"
        />
        <Stack direction="row" spacing={1} sx={layoutStyles.formFooterRow}>
          <ActionButton type="submit">
            {t("common.apply")}
          </ActionButton>
          <ActionButton
            onClick={() => {
              form.reset({
                isActive: true,
                name: "",
              });
            }}
            variant="outlined"
          >
            {t("common.reset")}
          </ActionButton>
        </Stack>
      </Stack>
    </DrawerPanel>
  );
}
