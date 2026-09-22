import { Paper, Stack } from "@mui/material";
import type { CounterpartyDto } from "../../counterparties/dtos/CounterpartyDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import type { BankDto } from "../../banks/dtos/BankDto";
import { TemplatePopulateActionCard } from "../../dashboard/components/TemplatePopulateActionCard";
import { TotalAmountByCurrencyCard } from "../../dashboard/components/TotalAmountByCurrencyCard";
import { TotalActiveBankAccountCard } from "../../dashboard/components/TotalActiveBankAccountCard";
import { MarkerPeriodsIncomeOutcomeCard } from "../../dashboard/components/MarkerPeriodsIncomeOutcomeCard/MarkerPeriodsIncomeOutcomeCard";
import type { TranslationKey } from "../../settings/provider/translations";

type Props = {
  banks: BankDto[];
  counterparties: CounterpartyDto[];
  currencies: CurrencyDto[];
  defaultMakerTagName?: string;
  t: (key: TranslationKey) => string;
};

export function TransactionDashboardPanel({
  banks,
  counterparties,
  currencies,
  defaultMakerTagName,
  t,
}: Props) {
  const defaultCurrencyCode = currencies.find((x) => x.isDefault)?.shortName;

  return (
    <Paper sx={{ p: 2, height: "100%" }}>
      <Stack spacing={2}>
        <TemplatePopulateActionCard
          banks={banks}
          currencies={currencies}
          counterparties={counterparties}
        />
        <TotalAmountByCurrencyCard
          defaultCurrencyCode={defaultCurrencyCode}
          title={t("transactions.totalByCurrency")}
        />
        <TotalActiveBankAccountCard title={t("transactions.totalByBank")} />
        <MarkerPeriodsIncomeOutcomeCard
          currencyCode={defaultCurrencyCode}
          defaultMakerTagName={defaultMakerTagName}
          title={t("transactions.incomeOutcome")}
        />
      </Stack>
    </Paper>
  );
}
