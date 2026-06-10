import { useEffect, useMemo, useState } from "react";
import { Drawer, DrawerBody, DrawerHeader } from "../../../../components/organisms/Drawer";
import type { BankDto } from "../../../banks/dtos/BankDto";
import type { CounterpartyDto } from "../../../counterparties/dtos/CounterpartyDto";
import type { CurrencyDto } from "../../../currencies/dtos/CurrencyDto";
import { useSettings } from "../../../settings/provider/SettingProvider";
import { getTemplateById } from "../../api/templatesApi";
import { safeParseTemplateData } from "../settings/TemplateDataCodec";
import type { TemplateData, TemplateType } from "../../dtos/TemplateDto";
import { BankAccountPopulateFormDrawer } from "./BankAccountPopulateFormDrawer";
import { CashFlowPopulateFormDrawer } from "./CashFlowPopulateFormDrawer";
import { ExchangePopulateFormDrawer } from "./ExchangePopulateFormDrawer";
import { TransferPopulateFormDrawer } from "./TransferPopulateFormDrawer";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  banks: BankDto[];
  currencies: CurrencyDto[];
  counterparties: CounterpartyDto[];
  initialTemplateId: string;
  onSaved?: () => Promise<void> | void;
};

const typeNumberToType = (n: number): TemplateType =>
  n === 1 ? "CashFlow" : n === 2 ? "Transfer" : n === 3 ? "Exchange" : "BankAccount";

export function TemplatePopulateDrawer({
  isOpen,
  onClose,
  banks,
  currencies,
  counterparties,
  initialTemplateId,
  onSaved,
}: Props) {
  const { t, todayIsoDate } = useSettings();
  const [selectedType, setSelectedType] = useState<TemplateType | null>(null);
  const [templateData, setTemplateData] = useState<TemplateData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setSelectedType(null);
    setTemplateData(null);
  }, [isOpen, initialTemplateId]);

  useEffect(() => {
    if (!isOpen || !initialTemplateId) return;
    let mounted = true;
    (async () => {
      try {
        const detail = await getTemplateById(initialTemplateId);
        if (!mounted) return;
        const type = typeNumberToType(detail.templateType);
        setSelectedType(type);
        setTemplateData(safeParseTemplateData(detail.templateDataJson, type));
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : t("templates.errorLoad"));
      }
    })();
    return () => {
      mounted = false;
    };
  }, [initialTemplateId, isOpen, t]);

  const currencyOptions = useMemo(
    () => currencies.map(x => ({ label: x.shortName, value: x.id })),
    [currencies],
  );
  const bankOptions = useMemo(
    () => banks.map(x => ({ label: x.shortName, value: x.id })),
    [banks],
  );
  const counterpartyOptions = useMemo(
    () => counterparties.map(x => ({ label: x.fullName, value: x.id })),
    [counterparties],
  );

  if (selectedType == null || templateData == null) {
    return (
      <Drawer isOpen={isOpen} onClose={onClose} title={t("templates.populate")} width="wide">
        <DrawerHeader />
        <DrawerBody errorMessage={error ?? undefined}>{null}</DrawerBody>
      </Drawer>
    );
  }

  if (selectedType === "CashFlow") {
    return (
      <CashFlowPopulateFormDrawer
        error={error}
        isOpen={isOpen}
        onClose={onClose}
        onSaved={onSaved}
        t={t}
        templateData={templateData}
        todayIsoDate={todayIsoDate}
        currencyOptions={currencyOptions}
      />
    );
  }

  if (selectedType === "Transfer") {
    return (
      <TransferPopulateFormDrawer
        error={error}
        isOpen={isOpen}
        onClose={onClose}
        onSaved={onSaved}
        t={t}
        templateData={templateData}
        todayIsoDate={todayIsoDate}
        currencyOptions={currencyOptions}
        counterpartyOptions={counterpartyOptions}
      />
    );
  }

  if (selectedType === "Exchange") {
    return (
      <ExchangePopulateFormDrawer
        error={error}
        isOpen={isOpen}
        onClose={onClose}
        onSaved={onSaved}
        t={t}
        templateData={templateData}
        todayIsoDate={todayIsoDate}
        currencyOptions={currencyOptions}
      />
    );
  }

  return (
    <BankAccountPopulateFormDrawer
      error={error}
      isOpen={isOpen}
      onClose={onClose}
      onSaved={onSaved}
      t={t}
      templateData={templateData}
      todayIsoDate={todayIsoDate}
      bankOptions={bankOptions}
      currencyOptions={currencyOptions}
    />
  );
}
