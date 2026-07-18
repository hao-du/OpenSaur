import { Paper, Stack } from "@mui/material";
import { ArrowRightLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { MetaText } from "../../../components/atoms/MetaText";
import { PageTitleText } from "../../../components/atoms/PageTitleText";
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
          <PageTitleText variant="h6">{t("dashboardSyncCard.title")}</PageTitleText>
          <MetaText>{t("dashboardSyncCard.subtitle")}</MetaText>
          {isLoading ? (
            <MetaText>{t("pendingTransactionsPage.loading")}</MetaText>
          ) : pendingTransactions.length > 0 ? (
            <MetaText sx={{ color: "secondary.main" }}>
              {t("dashboardSyncCard.pendingCount").replace("{count}", String(pendingTransactions.length))}
            </MetaText>
          ) : (
            <MetaText>{t("pendingTransactionsPage.noSubmissions")}</MetaText>
          )}
        </Stack>

        <Stack spacing={1} sx={{ mt: "auto" }}>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
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
