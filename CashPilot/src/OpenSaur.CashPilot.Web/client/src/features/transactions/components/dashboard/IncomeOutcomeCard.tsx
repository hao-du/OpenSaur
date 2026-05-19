import { Paper, Stack } from "@mui/material";
import { BodyText } from "../../../../components/atoms/BodyText";
import { PageTitleText } from "../../../../components/atoms/PageTitleText";
import type { IncomeOutcomeDto } from "../../dtos/TransactionDto";

type Props = {
  items: IncomeOutcomeDto[];
  title: string;
};

const amountFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export function IncomeOutcomeCard({ items, title }: Props) {
  const latestThreeMonths = [...items]
    .sort((a, b) => {
      if (a.year !== b.year) {
        return b.year - a.year;
      }
      return b.month - a.month;
    })
    .slice(0, 3);

  return (
    <Paper variant="outlined" sx={{ p: 1.5, height: "100%", display: "flex", flexDirection: "column" }}>
      <PageTitleText variant="h6">{title}</PageTitleText>
      <Stack spacing={0.5} sx={{ mt: 0.5, flex: 1 }}>
        {latestThreeMonths.map(item => (
          <Stack key={`${item.year}-${item.month}-${item.currencyCode}`} direction="row" justifyContent="space-between" spacing={2} alignItems="flex-start">
            <BodyText>{`${item.year}-${String(item.month).padStart(2, "0")} ${item.currencyCode}`}</BodyText>
            <Stack spacing={0.25} sx={{ fontVariantNumeric: "tabular-nums" }}>
              <BodyText sx={{ color: "success.main", minWidth: 160, textAlign: "right" }}>{`+${amountFormatter.format(item.income)}`}</BodyText>
              <BodyText sx={{ color: "error.main", minWidth: 160, textAlign: "right" }}>{`-${amountFormatter.format(item.outcome)}`}</BodyText>
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}
