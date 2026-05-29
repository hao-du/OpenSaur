import { Paper, Stack } from "@mui/material";
import { useEffect, useState } from "react";
import { Banknote, Landmark, Repeat, Users } from "lucide-react";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { DropDown } from "../../../components/atoms/DropDown";
import { PageTitleText } from "../../../components/atoms/PageTitleText";
import type { BankDto } from "../../banks/dtos/BankDto";
import type { CounterpartyDto } from "../../counterparties/dtos/CounterpartyDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import { useSettings } from "../../settings/provider/SettingProvider";
import { TemplatePopulateDrawer } from "../../templates/components/TemplatePopulateDrawer";
import type { TemplateListItemDto } from "../../templates/dtos/TemplateDto";
import { useForm } from "react-hook-form";

type Props = {
  templates: TemplateListItemDto[];
  banks: BankDto[];
  currencies: CurrencyDto[];
  counterparties: CounterpartyDto[];
  onSaved?: () => Promise<void> | void;
};
type FormValues = { templateId: string };

function typeIcon(templateType: number) {
  if (templateType === 1) return <Banknote size={16} />;
  if (templateType === 2) return <Users size={16} />;
  if (templateType === 3) return <Repeat size={16} />;
  return <Landmark size={16} />;
}

function typeColor(templateType: number) {
  if (templateType === 1) return "var(--tx-type-cashflow-color)";
  if (templateType === 2) return "var(--tx-type-transfer-color)";
  if (templateType === 3) return "var(--tx-type-exchange-color)";
  return "var(--tx-type-bankaccount-color)";
}

export function TemplatePopulateActionCard({ templates, banks, currencies, counterparties, onSaved }: Props) {
  const { t } = useSettings();
  const [isPopulateOpen, setIsPopulateOpen] = useState(false);
  const form = useForm<FormValues>({ defaultValues: { templateId: "" } });
  const selectedTemplateId = form.watch("templateId");

  useEffect(() => {
    if (templates.length === 0) {
      form.setValue("templateId", "");
      return;
    }

    if (!selectedTemplateId || !templates.some(template => template.id === selectedTemplateId)) {
      form.setValue("templateId", templates[0].id);
    }
  }, [form, selectedTemplateId, templates]);

  return (
    <>
      <Paper variant="outlined" sx={{ p: 1.5, height: "100%", display: "flex", flexDirection: "column" }}>
        <PageTitleText variant="h6">{t("templates.title")}</PageTitleText>
        <Stack spacing={0.5} sx={{ mt: 0.5, flex: 1 }}>
          <DropDown
            control={form.control}
            filterable
            label=""
            name="templateId"
            options={templates.map(template => ({
              icon: typeIcon(template.templateType),
              label: template.name,
              textColor: typeColor(template.templateType),
              value: template.id
            }))}
          />
          <Stack direction="row" justifyContent="flex-end">
            <ActionButton disabled={!selectedTemplateId} onClick={() => setIsPopulateOpen(true)}>
              {t("templates.populate")}
            </ActionButton>
          </Stack>
        </Stack>
      </Paper>

      <TemplatePopulateDrawer
        banks={banks}
        counterparties={counterparties}
        currencies={currencies}
        initialTemplateId={selectedTemplateId}
        isOpen={isPopulateOpen}
        onClose={() => setIsPopulateOpen(false)}
        onSaved={onSaved}
      />
    </>
  );
}
