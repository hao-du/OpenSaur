import { useEffect, useMemo, useState } from "react";
import { Drawer, DrawerBody, DrawerHeader } from "../../../../components/organisms/Drawer";
import type { BankDto } from "../../../banks/dtos/BankDto";
import type { CounterpartyDto } from "../../../counterparties/dtos/CounterpartyDto";
import type { CurrencyDto } from "../../../currencies/dtos/CurrencyDto";
import { useSettings } from "../../../settings/provider/SettingProvider";
import type { TemplateData, TemplateType } from "../../../templates/dtos/TemplateDto";
import type { OfflineTransactionRecord } from "../../storages/offlineTransactionsStore";
import { loadOfflineTemplates } from "../../storages/offlineTemplatesStore";
import { parseTemplateData, templateTypeNumberToTransactionType } from "../../services/offlineTransactionFormUtils";
import { OfflineBankAccountPopulateFormDrawer } from "./OfflineBankAccountPopulateFormDrawer";
import type { BankAccountTemplateDataShape } from "./types";
import { OfflineCashFlowPopulateFormDrawer } from "./OfflineCashFlowPopulateFormDrawer";
import { OfflineExchangePopulateFormDrawer } from "./OfflineExchangePopulateFormDrawer";
import { OfflineTransferPopulateFormDrawer } from "./OfflineTransferPopulateFormDrawer";

type Props = {
  banks: BankDto[];
  counterparties: CounterpartyDto[];
  currencies: CurrencyDto[];
  initialTemplateId: string;
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<OfflineTransactionRecord, "updatedAt">) => void;
};

type TemplateState = {
  error: string | null;
  templateData: TemplateData | null;
  templateType: TemplateType | null;
};

const emptyTemplateState: TemplateState = {
  error: null,
  templateData: null,
  templateType: null,
};

export function OfflineTemplatePopulateDrawer({
  banks,
  counterparties,
  currencies,
  initialTemplateId,
  isOpen,
  onClose,
  onSave,
}: Props) {
  const { t, todayIsoDate } = useSettings();
  const [state, setState] = useState<TemplateState>(emptyTemplateState);
  const currencyOptions = useMemo(
    () => currencies.map((item) => ({ label: item.shortName, value: item.id })),
    [currencies],
  );
  const counterpartyOptions = useMemo(
    () => counterparties.map((item) => ({ label: item.fullName, value: item.id })),
    [counterparties],
  );

  useEffect(() => {
    if (!isOpen) {
      setState(emptyTemplateState);
      return;
    }

    const template = loadOfflineTemplates().find((item) => item.id === initialTemplateId) ?? null;
    if (template == null) {
      setState({
        error: t("templates.errorLoad"),
        templateData: null,
        templateType: null,
      });
      return;
    }

    const templateType = templateTypeNumberToTransactionType(template.templateType);
    setState({
      error: null,
      templateData: parseTemplateData(template),
      templateType,
    });
  }, [initialTemplateId, isOpen, t]);

  if (state.templateType == null || state.templateData == null) {
    return (
      <Drawer isOpen={isOpen} onClose={onClose} title={t("templates.populate")} width="wide">
        <DrawerHeader />
        <DrawerBody errorMessage={state.error ?? undefined}>{null}</DrawerBody>
      </Drawer>
    );
  }

  if (state.templateType === "CashFlow") {
    return (
    <OfflineCashFlowPopulateFormDrawer
      currencyOptions={currencyOptions}
      isOpen={isOpen}
      onClose={onClose}
      onSave={onSave}
      t={t}
      templateData={state.templateData}
      todayIsoDate={todayIsoDate}
    />
  );
  }

  if (state.templateType === "Transfer") {
    return (
    <OfflineTransferPopulateFormDrawer
      counterpartyOptions={counterpartyOptions}
      currencyOptions={currencyOptions}
      isOpen={isOpen}
      onClose={onClose}
      onSave={onSave}
      t={t}
      templateData={state.templateData}
      todayIsoDate={todayIsoDate}
    />
  );
  }

  if (state.templateType === "Exchange") {
    return (
    <OfflineExchangePopulateFormDrawer
      currencyOptions={currencyOptions}
      isOpen={isOpen}
      onClose={onClose}
      onSave={onSave}
      t={t}
      templateData={state.templateData}
      todayIsoDate={todayIsoDate}
    />
  );
  }

  return (
    <OfflineBankAccountPopulateFormDrawer
      banks={banks}
      currencies={currencies}
      isOpen={isOpen}
      onClose={onClose}
      onSave={onSave}
      t={t}
      templateData={state.templateData as BankAccountTemplateDataShape}
      todayIsoDate={todayIsoDate}
    />
  );
}
