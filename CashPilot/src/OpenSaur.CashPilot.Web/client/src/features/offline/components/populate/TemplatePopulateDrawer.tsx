import { useEffect, useState } from "react";
import { Drawer, DrawerBody, DrawerHeader } from "../../../../components/organisms/Drawer";
import type { BankDto } from "../../../banks/dtos/BankDto";
import type { CounterpartyDto } from "../../../counterparties/dtos/CounterpartyDto";
import type { CurrencyDto } from "../../../currencies/dtos/CurrencyDto";
import { useSettings } from "../../../settings/provider/SettingProvider";
import type { TemplateData, TemplateType } from "../../../templates/dtos/TemplateDto";
import type { OfflineTransactionRecord } from "../../storages/offlineTransactionsStore";
import { loadOfflineTemplates } from "../../storages/offlineTemplatesStore";
import { parseTemplateData, templateTypeNumberToTransactionType } from "../../services/offlineTransactionFormUtils";
import { BankAccountPopulateFormDrawer } from "./BankAccountPopulateFormDrawer";
import { CashFlowPopulateFormDrawer } from "./CashFlowPopulateFormDrawer";
import { ExchangePopulateFormDrawer } from "./ExchangePopulateFormDrawer";
import { TransferPopulateFormDrawer } from "./TransferPopulateFormDrawer";

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

export function TemplatePopulateDrawer({
  banks,
  counterparties,
  currencies,
  initialTemplateId,
  isOpen,
  onClose,
  onSave,
}: Props) {
  const { t } = useSettings();
  const [state, setState] = useState<TemplateState>(emptyTemplateState);

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
      <CashFlowPopulateFormDrawer
        currencies={currencies}
        editingTransaction={null}
        isOpen={isOpen}
        onClose={onClose}
        onSave={onSave}
        templateData={state.templateData}
      />
    );
  }

  if (state.templateType === "Transfer") {
    return (
      <TransferPopulateFormDrawer
        counterparties={counterparties}
        currencies={currencies}
        editingTransaction={null}
        isOpen={isOpen}
        onClose={onClose}
        onSave={onSave}
        templateData={state.templateData}
      />
    );
  }

  if (state.templateType === "Exchange") {
    return (
      <ExchangePopulateFormDrawer
        currencies={currencies}
        editingTransaction={null}
        isOpen={isOpen}
        onClose={onClose}
        onSave={onSave}
        templateData={state.templateData}
      />
    );
  }

  return (
    <BankAccountPopulateFormDrawer
      banks={banks}
      currencies={currencies}
      editingTransaction={null}
      isOpen={isOpen}
      onClose={onClose}
      onSave={onSave}
      templateData={state.templateData}
    />
  );
}
