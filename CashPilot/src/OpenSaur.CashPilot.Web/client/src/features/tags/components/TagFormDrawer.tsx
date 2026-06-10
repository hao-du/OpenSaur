import type { UseFormReturn } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "../../../components/organisms/Drawer";
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
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? t("tags.editTitle") : t("tags.createTitle")}
    >
      <DrawerHeader />
      <DrawerBody
        component="form"
        id="tag-form"
        noValidate
        onSubmit={form.handleSubmit(async values => {
          await onSubmit(values);
        })}
      >
        <TagForm
          control={form.control}
          isSubmitting={isSubmitting}
        />
      </DrawerBody>
      <DrawerFooter
        actions={[
          <ActionButton key="submit" form="tag-form" disabled={isSubmitting} type="submit">
            {isSubmitting ? t("action.working") : isEditMode ? t("common.save") : t("common.create")}
          </ActionButton>
        ]}
      />
    </Drawer>
  );
}
