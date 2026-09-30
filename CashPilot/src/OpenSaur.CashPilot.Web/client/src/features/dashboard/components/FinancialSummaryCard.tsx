import { Paper, Skeleton, Stack } from "@mui/material";
import { BodyText } from "../../../components/atoms/BodyText";
import { PageTitleText } from "../../../components/atoms/PageTitleText";
import { useSettings } from "../../settings/provider/SettingProvider";
import { useActiveBankBalancesQuery } from "../../transactions/hooks/dashboard/useActiveBankBalancesQuery";
import { useCurrencyBalancesQuery } from "../../transactions/hooks/dashboard/useCurrencyBalancesQuery";

type Props = {
  defaultCurrencyCode?: string;
};

export function FinancialSummaryCard({ defaultCurrencyCode }: Props) {
  const { formatAmount, t } = useSettings();
  const currencyBalancesQuery = useCurrencyBalancesQuery();
  const activeBankBalancesQuery = useActiveBankBalancesQuery();

  const isLoading = currencyBalancesQuery.isLoading || activeBankBalancesQuery.isLoading;

  const currencyItems = currencyBalancesQuery.data ?? [];
  const bankItems = activeBankBalancesQuery.data ?? [];

  // Match the default currency (or fallback to the first active currency found)
  const currencyCode = defaultCurrencyCode || currencyItems[0]?.currencyCode || "VNĐ";

  const totalMoney = currencyItems.find(x => x.currencyCode === currencyCode)?.total ?? 0;
  const savingMoney = bankItems
    .filter(x => x.currencyCode === currencyCode)
    .reduce((sum, item) => sum + item.totalDeposited, 0);
  const remainingMoney = totalMoney - savingMoney;

  return (
    <Paper variant="outlined" sx={{ p: 1.5, height: "100%", display: "flex", flexDirection: "column" }}>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <PageTitleText variant="h6">{t("dashboard.financialSummary")}</PageTitleText>
        {currencyCode ? <BodyText>{`(${currencyCode})`}</BodyText> : null}
      </Stack>

      <Stack spacing={0.75} sx={{ mt: 1, flex: 1, justifyContent: "space-around" }}>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Stack key={index} direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
              <Skeleton height={22} variant="text" width="35%" />
              <Skeleton height={22} variant="text" width="40%" />
            </Stack>
          ))
        ) : (
          <>
            <Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
              <BodyText sx={{ color: "text.secondary" }}>{t("dashboard.totalMoney")}</BodyText>
              <BodyText className="numeric-text" sx={{ color: "success.main", fontWeight: 700, textAlign: "right" }}>
                {formatAmount(totalMoney)}
              </BodyText>
            </Stack>

            <Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
              <BodyText sx={{ color: "text.secondary" }}>{t("dashboard.savingMoney")}</BodyText>
              <BodyText className="numeric-text" sx={{ color: "info.main", fontWeight: 600, textAlign: "right" }}>
                {formatAmount(savingMoney)}
              </BodyText>
            </Stack>

            <Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
              <BodyText sx={{ color: "text.secondary" }}>{t("dashboard.remainingMoney")}</BodyText>
              <BodyText className="numeric-text" sx={{ color: "primary.main", fontWeight: 700, textAlign: "right" }}>
                {formatAmount(remainingMoney)}
              </BodyText>
            </Stack>
          </>
        )}
      </Stack>
    </Paper>
  );
}
