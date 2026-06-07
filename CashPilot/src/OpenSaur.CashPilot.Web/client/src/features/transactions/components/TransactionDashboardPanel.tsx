import { Paper, Stack } from "@mui/material";
import type { CounterpartyDto } from "../../counterparties/dtos/CounterpartyDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import type { BankDto } from "../../banks/dtos/BankDto";
import { TemplatePopulateActionCard } from "../../dashboard/components/TemplatePopulateActionCard";
import { DashboardCardSkeleton } from "../../dashboard/components/DashboardCardSkeleton";
import { TotalAmountByCurrencyCard } from "../../dashboard/components/TotalAmountByCurrencyCard";
import { TotalActiveBankAccountCard } from "../../dashboard/components/TotalActiveBankAccountCard";
import { IncomeOutcomeCard } from "../../dashboard/components/IncomeOutcomeCard";
import type { TransactionDashboardDto, IncomeOutcomeDto } from "../dtos/TransactionDto";
import type { TemplateListItemDto } from "../../templates/dtos/TemplateDto";
import type { TranslationKey } from "../../settings/provider/translations";

type Props = {
  banks: BankDto[];
  counterparties: CounterpartyDto[];
  currencies: CurrencyDto[];
  dashboard: TransactionDashboardDto | undefined;
  incomeOutcomeItems: IncomeOutcomeDto[];
  incomeOutcomeTitle: string;
  isCurrenciesLoading: boolean;
  isDashboardLoading: boolean;
  templates: TemplateListItemDto[];
  t: (key: TranslationKey) => string;
};

export function TransactionDashboardPanel({
  banks,
  counterparties,
  currencies,
  dashboard,
  incomeOutcomeItems,
  incomeOutcomeTitle,
  isCurrenciesLoading,
  isDashboardLoading,
  templates,
  t,
}: Props) {
  return (
    <Paper sx={{ p: 2, height: "100%" }}>
      <Stack spacing={2}>
        <TemplatePopulateActionCard
          templates={templates}
          banks={banks}
          currencies={currencies}
          counterparties={counterparties}
        />
        {isDashboardLoading ? (
          <>
            <DashboardCardSkeleton rows={4} />
            <DashboardCardSkeleton rows={3} />
            <DashboardCardSkeleton rows={4} />
          </>
        ) : (
          <>
            <TotalAmountByCurrencyCard
              items={dashboard?.currencyBalances ?? []}
              title={t("transactions.totalByCurrency")}
            />
            <TotalActiveBankAccountCard
              items={dashboard?.activeBankBalances ?? []}
              title={t("transactions.totalByBank")}
            />
            <IncomeOutcomeCard
              items={isCurrenciesLoading ? [] : incomeOutcomeItems}
              title={incomeOutcomeTitle}
            />
          </>
        )}
      </Stack>
    </Paper>
  );
}
