import type { ReactNode } from "react";
import { Box, Stack, Tab, Tabs } from "@mui/material";
import { tabSelectedBg } from "../../../infrastructure/theme/theme";
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
      <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={value}
          onChange={(_, nextValue: TransactionTabValue) => onChange(nextValue)}
          textColor="primary"
          indicatorColor="primary"
          sx={{
            minHeight: 36,
            "& .MuiTab-root": {
              minHeight: 36,
              py: 0,
              px: 2,
              color: "text.secondary"
            },
            "& .MuiTab-root.Mui-selected": {
              color: "primary.main",
              bgcolor: tabSelectedBg
            }
          }}
        >
          <Tab label={t("transactions.formTab")} value="form" />
          <Tab label={t("transactions.transactionItems.tab")} value="items" />
        </Tabs>
      </Box>
      <Stack spacing={2} sx={{ mt: 0, pt: 0 }}>
        <Box sx={{ display: value === "form" ? "block" : "none" }}>
          {formContent}
        </Box>
        <Box sx={{ display: value === "items" ? "block" : "none" }}>
          {itemsContent}
        </Box>
      </Stack>
    </Stack>
  );
}
