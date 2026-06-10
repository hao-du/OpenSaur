import { Stack } from "@mui/material";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { CheckBox } from "../../../components/atoms/CheckBox";
import { Text } from "../../../components/atoms/Text";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "../../../components/organisms/Drawer";
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
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={t("tags.filterTitle")}
    >
      <DrawerHeader />
      <DrawerBody
        component="form"
        id="tags-filter-form"
        noValidate
        onSubmit={form.handleSubmit(values => {
          onApply({
            ...values,
            name: values.name.trim()
          });
        })}
      >
        <Stack spacing={2}>
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
              });
            }}
            variant="outlined"
          >
            {t("common.reset")}
          </ActionButton>,
          <ActionButton key="apply" form="tags-filter-form" type="submit">
            {t("common.apply")}
          </ActionButton>
        ]}
      />
    </Drawer>
  );
}
