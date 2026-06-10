import { useState } from "react";
import type { TranslationKey } from "../../../settings/provider/translations";
import { ActionButton } from "../../../../components/atoms/ActionButton";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "../../../../components/organisms/Drawer";
import { ExchangePopulateForm } from "./ExchangePopulateForm";
import type { ExchangeTemplateDataShape, OptionItem } from "./types";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  t: (key: TranslationKey) => string;
  todayIsoDate: string;
  currencyOptions: OptionItem[];
  templateData: ExchangeTemplateDataShape;
  onSaved?: () => Promise<void> | void;
  error?: string | null;
};

export function ExchangePopulateFormDrawer({
  isOpen,
  onClose,
  t,
  todayIsoDate,
  currencyOptions,
  templateData,
  onSaved,
  error,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`${t("templates.populate")} ${t("templates.templateType.exchange")}`}
      width="wide"
    >
      <DrawerHeader />
      <DrawerBody errorMessage={error ?? undefined}>
        <ExchangePopulateForm
          formId="exchange-populate-form"
          currencyOptions={currencyOptions}
          onClose={onClose}
          onSaved={onSaved}
          onSubmittingChange={setIsSubmitting}
          t={t}
          templateData={templateData}
          todayIsoDate={todayIsoDate}
        />
      </DrawerBody>
      <DrawerFooter
        actions={[
          <ActionButton key="submit" disabled={isSubmitting} form="exchange-populate-form" type="submit">
            {isSubmitting ? t("action.working") : t("transactions.create")}
          </ActionButton>
        ]}
      />
    </Drawer>
  );
}
