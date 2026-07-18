import type { UseFormReturn } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "../../../components/organisms/Drawer";
import { useSettings } from "../../settings/provider/SettingProvider";
import { CurrencyForm, type CurrencyFormValues } from "./CurrencyForm";

type CurrencyFormDrawerProps = {
  form: UseFormReturn<CurrencyFormValues>;
  isEditMode: boolean;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: CurrencyFormValues) => Promise<void>;
};

export function CurrencyFormDrawer({
  form,
  isEditMode,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit
}: CurrencyFormDrawerProps) {
  const { t } = useSettings();

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? t("currencies.editTitle") : t("currencies.createTitle")}
    >
      <DrawerHeader />
      <DrawerBody
        component="form"
        id="currency-form"
        noValidate
        onSubmit={form.handleSubmit(async values => {
          await onSubmit(values);
        })}
      >
        <CurrencyForm
          control={form.control}
          isSubmitting={isSubmitting}
        />
      </DrawerBody>
      <DrawerFooter
        actions={[
          <ActionButton key="submit" form="currency-form" disabled={isSubmitting} type="submit">
            {isSubmitting ? t("action.working") : isEditMode ? t("common.save") : t("common.create")}
          </ActionButton>
        ]}
      />
    </Drawer>
  );
}

