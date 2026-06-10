import type { UseFormReturn } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "../../../components/organisms/Drawer";
import { useSettings } from "../../settings/provider/SettingProvider";
import { BankForm, type BankFormValues } from "./BankForm";

type BankFormDrawerProps = {
  form: UseFormReturn<BankFormValues>;
  isEditMode: boolean;
  isOpen: boolean;
  isSubmitting: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onSubmit: (values: BankFormValues) => Promise<void>;
};

export function BankFormDrawer({
  form,
  isEditMode,
  isOpen,
  isSubmitting,
  errorMessage,
  onClose,
  onSubmit,
}: BankFormDrawerProps) {
  const { t } = useSettings();

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? t("banks.editTitle") : t("banks.createTitle")}
      width="wide"
    >
      <DrawerHeader />
      <DrawerBody
        component="form"
        id="bank-form"
        errorMessage={errorMessage}
        noValidate
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit(values);
        })}
      >
        <BankForm
          control={form.control}
          isSubmitting={isSubmitting}
        />
      </DrawerBody>
      <DrawerFooter
        actions={[
          <ActionButton key="save" disabled={isSubmitting} form="bank-form" type="submit">
            {isSubmitting ? t("action.working") : isEditMode ? t("common.save") : t("common.create")}
          </ActionButton>,
        ]}
      />
    </Drawer>
  );
}
