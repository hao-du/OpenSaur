import { useMemo, useState } from "react";
import type { TranslationKey } from "../../../settings/provider/translations";
import { ActionButton } from "../../../../components/atoms/ActionButton";
import { Drawer, DrawerBody, DrawerFooter, DrawerHeader } from "../../../../components/organisms/Drawer";
import type { BankDto } from "../../../banks/dtos/BankDto";
import type { CurrencyDto } from "../../../currencies/dtos/CurrencyDto";
import { OfflineBankAccountPopulateForm } from "./OfflineBankAccountPopulateForm";
import type { BankAccountTemplateDataShape, OptionItem } from "./types";
import type { OfflineTransactionRecord } from "../../storages/offlineTransactionsStore";

type Props = {
  banks: BankDto[];
  currencies: CurrencyDto[];
  isOpen: boolean;
  onClose: () => void;
  t: (key: TranslationKey) => string;
  todayIsoDate: string;
  templateData: BankAccountTemplateDataShape;
  onSave: (record: Omit<OfflineTransactionRecord, "updatedAt">) => Promise<void> | void;
  error?: string | null;
};

export function OfflineBankAccountPopulateFormDrawer({
  banks,
  currencies,
  isOpen,
  onClose,
  t,
  todayIsoDate,
  templateData,
  onSave,
  error,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const bankOptions = useMemo<OptionItem[]>(
    () => banks.map((item) => ({ label: item.shortName, value: item.id })),
    [banks],
  );
  const currencyOptions = useMemo<OptionItem[]>(
    () => currencies.map((item) => ({ label: item.shortName, value: item.id })),
    [currencies],
  );

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`${t("templates.populate")} ${t("templates.templateType.bankAccount")}`}
      width="wide"
    >
      <DrawerHeader />
      <DrawerBody errorMessage={error ?? undefined}>
        <OfflineBankAccountPopulateForm
          formId="bank-account-populate-form"
          bankOptions={bankOptions}
          currencyOptions={currencyOptions}
          onClose={onClose}
          onSave={onSave}
          onSubmittingChange={setIsSubmitting}
          t={t}
          templateData={templateData}
          todayIsoDate={todayIsoDate}
        />
      </DrawerBody>
      <DrawerFooter
        actions={[
          <ActionButton key="submit" disabled={isSubmitting} form="bank-account-populate-form" type="submit">
            {isSubmitting ? t("action.working") : t("transactions.create")}
          </ActionButton>,
        ]}
      />
    </Drawer>
  );
}
