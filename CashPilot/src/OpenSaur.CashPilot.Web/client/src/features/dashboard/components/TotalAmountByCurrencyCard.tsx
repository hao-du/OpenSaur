import { Paper, Skeleton, Stack } from "@mui/material";
import { BodyText } from "../../../components/atoms/BodyText";
import { PageTitleText } from "../../../components/atoms/PageTitleText";
import { useSettings } from "../../settings/provider/SettingProvider";
import { useCurrencyBalancesQuery } from "../../transactions/hooks/dashboard/useCurrencyBalancesQuery";
import type { CurrencyBalanceDto } from "../../transactions/dtos/TransactionDto";

type Props = {
  title: string;
  defaultCurrencyCode?: string;
};

export function TotalAmountByCurrencyCard({ title, defaultCurrencyCode }: Props) {
  const { formatAmount } = useSettings();
  const currencyBalancesQuery = useCurrencyBalancesQuery();
  const items: CurrencyBalanceDto[] = currencyBalancesQuery.data ?? [];
  const isLoading = currencyBalancesQuery.isLoading;

  return (
    <Paper variant="outlined" sx={{ p: 1.5, height: "100%", display: "flex", flexDirection: "column" }}>
      <PageTitleText variant="h6">{title}</PageTitleText>
      <Stack spacing={0.5} sx={{ mt: 0.5, flex: 1 }}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Stack key={index} direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
              <Skeleton height={22} variant="text" width="28%" />
              <Skeleton height={22} variant="text" width="34%" />
            </Stack>
          ))
        ) : (
          items.map(item => (
            <Stack key={item.currencyCode} direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
              <BodyText sx={{ color: "secondary.main", fontWeight: item.currencyCode === defaultCurrencyCode ? 700 : 400 }}>{item.currencyCode}</BodyText>
              <BodyText sx={{ color: "success.main", fontVariantNumeric: "tabular-nums", textAlign: "right" }}>{formatAmount(item.total)}</BodyText>
            </Stack>
          ))
        )}
      </Stack>
    </Paper>
  );
}
