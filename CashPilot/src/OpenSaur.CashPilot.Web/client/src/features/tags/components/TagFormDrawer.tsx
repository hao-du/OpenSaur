import type { BaseDrawerProps } from "../../../shared-domain/transactions/types";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "../../../components/organisms/Drawer";
import { useSettings } from "../../settings/provider/SettingProvider";
import { TagForm } from "./TagForm";
import type { TagFormValues } from "../dtos/TagDto";

export function TagFormDrawer({
  form,
  isEditMode,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
}: BaseDrawerProps<TagFormValues>) {
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
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values);
        })}
      >
        <TagForm
          control={form.control}
          isSubmitting={isSubmitting}
          setValue={form.setValue}
        />
      </DrawerBody>
      <DrawerFooter
        actions={[
          <ActionButton
            key="submit"
            form="tag-form"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? t("action.working") : isEditMode ? t("common.save") : t("common.create")}
          </ActionButton>
        ]}
      />
    </Drawer>
  );
}
