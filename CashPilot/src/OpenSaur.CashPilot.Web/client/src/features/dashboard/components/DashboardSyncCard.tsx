import { Paper, Stack, Typography } from "@mui/material";
import { ArrowRightLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { usePendingTransactionsQuery } from "../../pending/hooks/usePendingTransactionsQuery";
import { useSettings } from "../../../features/settings/provider/SettingProvider";

export function DashboardSyncCard() {
  const navigate = useNavigate();
  const { t } = useSettings();
  const { data: pendingTransactions = [], isLoading } = usePendingTransactionsQuery();

  return (
    <Paper elevation={0} sx={{ border: "1px solid rgba(0,0,0,0.08)", p: 2.5, position: "relative", overflow: "hidden" }}>
      <Stack spacing={2} sx={{ height: "100%" }}>
        <Stack spacing={0.5}>
          <Typography variant="h6">{t("dashboardSyncCard.title")}</Typography>
          <Typography color="text.secondary" variant="body2">
            {t("dashboardSyncCard.subtitle")}
          </Typography>
          {isLoading ? (
            <Typography color="text.secondary" variant="body2">{t("pendingTransactionsPage.loading")}</Typography>
          ) : pendingTransactions.length > 0 ? (
            <Typography color="warning.main" variant="body2" sx={{ fontWeight: 600 }}>
              {t("dashboardSyncCard.pendingCount").replace("{count}", String(pendingTransactions.length))}
            </Typography>
          ) : (
            <Typography color="text.secondary" variant="body2">
              {t("pendingTransactionsPage.noSubmissions")}
            </Typography>
          )}
        </Stack>

        <Stack spacing={1} sx={{ mt: "auto" }}>
          <Stack direction="row" spacing={1} flexWrap="wrap">
            <ActionButton
              endIcon={<ArrowRightLeft size={16} />}
              onClick={() => navigate("/pending-transactions")}
              variant="contained"
            >
              {t("dashboardSyncCard.manageAction")}
            </ActionButton>
          </Stack>
        </Stack>
      </Stack>
    </Paper>
  );
}
