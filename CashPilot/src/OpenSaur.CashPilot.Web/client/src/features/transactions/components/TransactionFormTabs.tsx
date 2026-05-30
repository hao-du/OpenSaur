import type { ReactNode } from "react";
import { Stack, Tab, Tabs } from "@mui/material";
import { useSettings } from "../../settings/provider/SettingProvider";

export type TransactionTabValue = "form" | "items";

type Props = {
  value: TransactionTabValue;
  onChange: (value: TransactionTabValue) => void;
  formContent: ReactNode;
  itemsContent: ReactNode;
};

export function TransactionFormTabs({
  value,
  onChange,
  formContent,
  itemsContent
}: Props) {
  const { t } = useSettings();

  return (
    <Stack spacing={2}>
      <Tabs value={value} onChange={(_, nextValue: TransactionTabValue) => onChange(nextValue)}>
        <Tab label={t("transactions.formTab")} value="form" />
        <Tab label={t("transactions.transactionItems.tab")} value="items" />
      </Tabs>
      <Stack spacing={2} sx={{ mt: 1, pt: 0 }}>
        {value === "form" ? formContent : itemsContent}
      </Stack>
    </Stack>
  );
}
