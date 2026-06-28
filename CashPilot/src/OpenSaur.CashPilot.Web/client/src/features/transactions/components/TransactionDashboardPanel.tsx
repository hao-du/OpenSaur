import { Grid, Paper, Stack } from "@mui/material";
import type { CounterpartyDto } from "../../counterparties/dtos/CounterpartyDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import type { BankDto } from "../../banks/dtos/BankDto";
import { TemplatePopulateActionCard } from "../../dashboard/components/TemplatePopulateActionCard";
import { DashboardSyncCard } from "../../dashboard/components/DashboardSyncCard";
import { DashboardCardSkeleton } from "../../dashboard/components/DashboardCardSkeleton";
import { TotalAmountByCurrencyCard } from "../../dashboard/components/TotalAmountByCurrencyCard";
import { TotalActiveBankAccountCard } from "../../dashboard/components/TotalActiveBankAccountCard";
import { IncomeOutcomeMakerPeriodsCard } from "../../dashboard/components/IncomeOutcomeMakerPeriodsCard";
import { IncomeOutcomeMonthlyCard } from "../../dashboard/components/IncomeOutcomeMonthlyCard";
import type { TransactionDashboardDto, IncomeOutcomeDto } from "../dtos/TransactionDto";
import { useMarkerTagsQuery } from "../hooks/useMarkerTagsQuery";
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
  const markerTagsQuery = useMarkerTagsQuery();
  const defaultMakerTag = markerTagsQuery.data?.find(tag => tag.isDefaultMaker);
  const defaultCurrencyCode = currencies.find(x => x.isDefault)?.shortName;
  const isMarkerTagsLoading = markerTagsQuery.isLoading || markerTagsQuery.isFetching;

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
        {isDashboardLoading || isMarkerTagsLoading ? (
          <>
            <DashboardCardSkeleton rows={4} />
            <DashboardCardSkeleton rows={3} />
            <DashboardCardSkeleton rows={4} />
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
            <IncomeOutcomeMonthlyCard
              currencyCode={defaultCurrencyCode}
              items={isCurrenciesLoading ? [] : incomeOutcomeItems}
              title={incomeOutcomeTitle}
            />
            {defaultMakerTag != null && defaultMakerTag.name.trim().length > 0 ? (
              <IncomeOutcomeMakerPeriodsCard
                currencyCode={defaultCurrencyCode}
                defaultMakerTagName={defaultMakerTag.name.trim()}
                title={incomeOutcomeTitle}
              />
            ) : null}
          </>
        )}
      </Stack>
    </Paper>
  );
}
