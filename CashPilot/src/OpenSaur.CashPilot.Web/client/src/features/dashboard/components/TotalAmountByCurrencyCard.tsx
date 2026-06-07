import { Paper, Stack } from "@mui/material";
import { BodyText } from "../../../components/atoms/BodyText";
import { PageTitleText } from "../../../components/atoms/PageTitleText";
import { useSettings } from "../../settings/provider/SettingProvider";
import type { CurrencyBalanceDto } from "../../transactions/dtos/TransactionDto";

type Props = {
  items: CurrencyBalanceDto[];
  title: string;
};

export function TotalAmountByCurrencyCard({ items, title }: Props) {
  const { formatAmount } = useSettings();
  return (
    <Paper variant="outlined" sx={{ p: 1.5, height: "100%", display: "flex", flexDirection: "column" }}>
      <PageTitleText variant="h6">{title}</PageTitleText>
      <Stack spacing={0.5} sx={{ mt: 0.5, flex: 1 }}>
        {items.map(item => (
          <Stack key={item.currencyCode} direction="row" justifyContent="space-between" spacing={2}>
            <BodyText>{item.currencyCode}</BodyText>
            <BodyText sx={{ fontVariantNumeric: "tabular-nums", textAlign: "right" }}>{formatAmount(item.total)}</BodyText>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}
