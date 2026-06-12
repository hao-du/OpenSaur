import { Grid, Paper, Stack } from "@mui/material";
import type { CounterpartyDto } from "../../counterparties/dtos/CounterpartyDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import type { BankDto } from "../../banks/dtos/BankDto";
import { TemplatePopulateActionCard } from "../../dashboard/components/TemplatePopulateActionCard";
import { DashboardSyncCard } from "../../dashboard/components/DashboardSyncCard";
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
        <Grid container spacing={2} alignItems="stretch">
          <Grid size={{ lg: 6, xs: 12 }}>
            <TemplatePopulateActionCard
              templates={templates}
              banks={banks}
              currencies={currencies}
              counterparties={counterparties}
            />
          </Grid>
          <Grid size={{ lg: 6, xs: 12 }}>
            <DashboardSyncCard />
          </Grid>
        </Grid>
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
