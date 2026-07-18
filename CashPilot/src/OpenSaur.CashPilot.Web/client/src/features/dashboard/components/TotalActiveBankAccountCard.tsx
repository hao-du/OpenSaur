import { Paper, Skeleton, Stack } from "@mui/material";
import { BodyText } from "../../../components/atoms/BodyText";
import { PageTitleText } from "../../../components/atoms/PageTitleText";
import { useSettings } from "../../settings/provider/SettingProvider";
import { useActiveBankBalancesQuery } from "../../transactions/hooks/dashboard/useActiveBankBalancesQuery";

type Props = {
  title: string;
};

export function TotalActiveBankAccountCard({ title }: Props) {
  const { formatAmount } = useSettings();
  const activeBankBalancesQuery = useActiveBankBalancesQuery();
  const items = activeBankBalancesQuery.data ?? [];
  const isLoading = activeBankBalancesQuery.isLoading;

  return (
    <Paper variant="outlined" sx={{ p: 1.5, height: "100%", display: "flex", flexDirection: "column" }}>
      <PageTitleText variant="h6">{title}</PageTitleText>
      <Stack spacing={0.5} sx={{ mt: 0.5, flex: 1 }}>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <Stack key={index} spacing={0.15}>
              <Skeleton height={24} variant="text" width="60%" />
              <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
                <Skeleton height={20} variant="text" width="18%" />
                <Skeleton height={20} variant="text" width="32%" />
              </Stack>
            </Stack>
          ))
        ) : (
          items.map(item => (
            <Stack key={`${item.bankName}-${item.currencyCode}`} spacing={0.15}>
              <BodyText sx={{ color: "secondary.main" }}>{item.bankName}</BodyText>
              <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
                <BodyText sx={{ color: "success.main", textAlign: "right" }}>{item.currencyCode}</BodyText>
                <BodyText sx={{ color: "success.main", fontVariantNumeric: "tabular-nums", textAlign: "right" }}>{formatAmount(item.totalDeposited)}</BodyText>
              </Stack>
            </Stack>
          ))
        )}
      </Stack>
    </Paper>
  );
}
