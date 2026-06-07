import { Stack } from "@mui/material";
import type { UseFormReturn } from "react-hook-form";
import { DrawerPanel } from "../../../components/organisms/DrawerPanel";
import { useSettings } from "../../settings/provider/SettingProvider";
import { TagForm, type TagFormValues } from "./TagForm";

type TagFormDrawerProps = {
  form: UseFormReturn<TagFormValues>;
  isEditMode: boolean;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: TagFormValues) => Promise<void>;
};

export function TagFormDrawer({ form, isEditMode, isOpen, isSubmitting, onClose, onSubmit }: TagFormDrawerProps) {
  const { t } = useSettings();
  return (
    <DrawerPanel
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? t("tags.editTitle") : t("tags.createTitle")}
    >
      <Stack
        component="form"
        noValidate
        onSubmit={form.handleSubmit(async values => {
          await onSubmit(values);
        })}
      >
        <TagForm
          control={form.control}
          isSubmitting={isSubmitting}
          submitLabel={isEditMode ? t("common.save") : t("common.create")}
        />
      </Stack>
    </DrawerPanel>
  );
}
