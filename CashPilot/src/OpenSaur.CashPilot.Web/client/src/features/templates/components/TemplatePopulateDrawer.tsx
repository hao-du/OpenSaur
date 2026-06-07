import { Alert, Stack } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { DrawerPanel } from "../../../components/organisms/DrawerPanel";
import type { BankDto } from "../../banks/dtos/BankDto";
import type { CounterpartyDto } from "../../counterparties/dtos/CounterpartyDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import { useSettings } from "../../settings/provider/SettingProvider";
import { getTemplateById } from "../api/templatesApi";
import { safeParseTemplateData } from "./settings/TemplateDataCodec";
import type { TemplateData, TemplateType } from "../dtos/TemplateDto";
import { BankAccountPopulateForm } from "./populate/BankAccountPopulateForm";
import { CashFlowPopulateForm } from "./populate/CashFlowPopulateForm";
import { ExchangePopulateForm } from "./populate/ExchangePopulateForm";
import { TransferPopulateForm } from "./populate/TransferPopulateForm";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  banks: BankDto[];
  currencies: CurrencyDto[];
  counterparties: CounterpartyDto[];
  initialTemplateId: string;
  onSaved?: () => Promise<void> | void;
};

const typeNumberToType = (n: number): TemplateType => (n === 1 ? "CashFlow" : n === 2 ? "Transfer" : n === 3 ? "Exchange" : "BankAccount");

export function TemplatePopulateDrawer({ isOpen, onClose, banks, currencies, counterparties, initialTemplateId, onSaved }: Props) {
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
    return () => { mounted = false; };
  }, [initialTemplateId, isOpen, t]);

  const currencyOptions = useMemo(() => currencies.map(x => ({ label: x.shortName, value: x.id })), [currencies]);
  const bankOptions = useMemo(() => banks.map(x => ({ label: x.shortName, value: x.id })), [banks]);
  const counterpartyOptions = useMemo(() => counterparties.map(x => ({ label: x.fullName, value: x.id })), [counterparties]);
  const typeLabel = selectedType === "CashFlow"
    ? t("templates.templateType.cashFlow")
    : selectedType === "Transfer"
      ? t("templates.templateType.transfer")
      : selectedType === "Exchange"
        ? t("templates.templateType.exchange")
        : selectedType === "BankAccount"
          ? t("templates.templateType.bankAccount")
          : "";
  const drawerTitle = typeLabel.length > 0 ? `${t("templates.populate")} ${typeLabel}` : t("templates.populate");

  return (
    <DrawerPanel isOpen={isOpen} onClose={onClose} title={drawerTitle} width="wide">
      <Stack spacing={1}>
        {error != null ? <Alert severity="error">{error}</Alert> : null}

        {selectedType === "CashFlow" && templateData != null ? (
          <CashFlowPopulateForm
            currencyOptions={currencyOptions}
            onClose={onClose}
            onSaved={onSaved}
            t={t}
            templateData={templateData as any}
            todayIsoDate={todayIsoDate}
          />
        ) : null}
        {selectedType === "Transfer" && templateData != null ? (
          <TransferPopulateForm
            counterpartyOptions={counterpartyOptions}
            currencyOptions={currencyOptions}
            onClose={onClose}
            onSaved={onSaved}
            t={t}
            templateData={templateData as any}
            todayIsoDate={todayIsoDate}
          />
        ) : null}
        {selectedType === "Exchange" && templateData != null ? (
          <ExchangePopulateForm
            currencyOptions={currencyOptions}
            onClose={onClose}
            onSaved={onSaved}
            t={t}
            templateData={templateData as any}
            todayIsoDate={todayIsoDate}
          />
        ) : null}
        {selectedType === "BankAccount" && templateData != null ? (
          <BankAccountPopulateForm
            bankOptions={bankOptions}
            currencyOptions={currencyOptions}
            onClose={onClose}
            onSaved={onSaved}
            t={t}
            templateData={templateData as any}
            todayIsoDate={todayIsoDate}
          />
        ) : null}
      </Stack>
    </DrawerPanel>
  );
}
