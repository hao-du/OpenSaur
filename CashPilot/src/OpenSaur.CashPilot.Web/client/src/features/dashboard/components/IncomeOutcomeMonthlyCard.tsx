import { Paper, Stack } from "@mui/material";
import { BodyText } from "../../../components/atoms/BodyText";
import { PageTitleText } from "../../../components/atoms/PageTitleText";
import { useSettings } from "../../settings/provider/SettingProvider";
import type { IncomeOutcomeDto } from "../../transactions/dtos/TransactionDto";

type Props = {
  items: IncomeOutcomeDto[];
  title: string;
  currencyCode?: string;
};

export function IncomeOutcomeMonthlyCard({ items, title, currencyCode }: Props) {
  const { formatAmount } = useSettings();

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
      <Stack direction="row" spacing={1} alignItems="center">
        <PageTitleText variant="h6">{title}</PageTitleText>
        {currencyCode != null && currencyCode.trim().length > 0 ? (
          <BodyText>{`(${currencyCode})`}</BodyText>
        ) : null}
      </Stack>
      <Stack spacing={1.25} sx={{ mt: 0.75, flex: 1 }}>
        {latestThreeMonths.map(item => (
          <Stack
            key={`${item.year}-${item.month}-${item.currencyCode}`}
            direction="row"
            justifyContent="space-between"
            spacing={2}
            alignItems="flex-start"
          >
            <BodyText sx={{ minWidth: 110, pt: 0.25 }}>{`${item.year}-${String(item.month).padStart(2, "0")} ${item.currencyCode}`}</BodyText>
            <Stack spacing={0.25} sx={{ minWidth: 160, fontVariantNumeric: "tabular-nums" }}>
              <BodyText sx={{ color: "success.main", textAlign: "right" }}>{`+${formatAmount(item.income)}`}</BodyText>
              <BodyText sx={{ color: "error.main", textAlign: "right" }}>{`-${formatAmount(item.outcome)}`}</BodyText>
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}
