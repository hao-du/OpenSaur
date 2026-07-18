import { ActionButton } from "../../../components/atoms/ActionButton";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "../../../components/organisms/Drawer";
import { useSettings } from "../../settings/provider/SettingProvider";
import { CounterpartyForm, type CounterpartyFormValues } from "./CounterpartyForm";
import type { BaseDrawerProps } from "../../../shared-domain/transactions/types";

type CounterpartyFormDrawerProps = BaseDrawerProps<CounterpartyFormValues>;

export function CounterpartyFormDrawer({
  form,
  isEditMode,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit
}: CounterpartyFormDrawerProps) {
  const { t } = useSettings();

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? t("counterparties.editTitle") : t("counterparties.createTitle")}
    >
      <DrawerHeader />
      <DrawerBody
        component="form"
        id="counterparty-form"
        noValidate
        onSubmit={form.handleSubmit(async values => {
          await onSubmit(values);
        })}
      >
        <CounterpartyForm
          control={form.control}
          isSubmitting={isSubmitting}
        />
      </DrawerBody>
      <DrawerFooter
        actions={[
          <ActionButton key="submit" form="counterparty-form" disabled={isSubmitting} type="submit">
            {isSubmitting ? t("action.working") : isEditMode ? t("common.save") : t("common.create")}
          </ActionButton>
        ]}
      />
    </Drawer>
  );
}

