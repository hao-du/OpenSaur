import { useEffect, useState } from "react";
import { Alert, Box, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import { ArrowDownUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { useNetworkStatus } from "../../../infrastructure/offline/useNetworkStatus";
import { loadOfflineMetadataSnapshot } from "../../offline/storages/offlineMetadataStore";
import { loadOfflineTransactions } from "../../offline/storages/offlineTransactionsStore";
import { syncOfflineMetadata, syncOfflineTransactions } from "../../offline/services/offlineSyncService";
import { useSettings } from "../../settings/provider/SettingProvider";

export function DashboardSyncCard() {
  const navigate = useNavigate();
  const { t } = useSettings();
  const { isOnline } = useNetworkStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [pendingTransactionCount, setPendingTransactionCount] = useState(0);

  useEffect(() => {
    const snapshot = loadOfflineMetadataSnapshot();
    setLastSyncedAt(snapshot?.savedAt ?? null);
    setPendingTransactionCount(loadOfflineTransactions().length);
  }, []);

  const handleSync = async () => {
    try {
      setErrorMessage(null);
      setIsSyncing(true);
      const snapshot = await syncOfflineMetadata();
      const transactionSyncResult = await syncOfflineTransactions();
      setLastSyncedAt(snapshot.savedAt);
      setPendingTransactionCount(loadOfflineTransactions().length);

      if (transactionSyncResult.failed > 0) {
        setErrorMessage(`${transactionSyncResult.failed} ${t("offline.pendingTransactionsFailed")}`);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : t("offline.syncFailed"));
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Paper elevation={0} sx={{ border: "1px solid rgba(0,0,0,0.08)", p: 2.5, position: "relative", overflow: "hidden" }}>
      <Stack spacing={2} sx={{ height: "100%" }}>
        <Stack spacing={0.5}>
          <Typography variant="h6">{t("offline.syncTitle")}</Typography>
          <Typography color="text.secondary" variant="body2">
            {t("offline.syncDescription")}
          </Typography>
          {pendingTransactionCount > 0 ? (
            <Typography color="warning.main" variant="body2" sx={{ fontWeight: 600 }}>
              {pendingTransactionCount} {t("offline.pendingTransactionsNeedSync")}
            </Typography>
          ) : (
            <Typography color="text.secondary" variant="body2">
              {t("offline.noPendingTransactions")}
            </Typography>
          )}
        </Stack>

        {errorMessage != null ? <Alert severity="error">{errorMessage}</Alert> : null}

        <Stack spacing={1} sx={{ mt: "auto" }}>
          {lastSyncedAt != null ? (
            <Typography color="text.secondary" variant="caption">
              {t("offline.lastSynced")}: {new Date(lastSyncedAt).toLocaleString()}
            </Typography>
          ) : null}

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <ActionButton
              disabled={isOnline !== true || isSyncing}
              endIcon={<ArrowDownUp size={16} />}
              onClick={() => {
                void handleSync();
              }}
              variant="contained"
            >
              {isSyncing ? t("offline.syncing") : t("offline.sync")}
            </ActionButton>
            <ActionButton
              onClick={() => {
                navigate("/offline/transactions");
              }}
              variant="outlined"
            >
              {t("offline.manage")}
            </ActionButton>
          </Stack>
        </Stack>
      </Stack>

      {isSyncing ? (
        <Box sx={{ position: "absolute", insetInline: 0, bottom: 0 }}>
          <LinearProgress sx={{ borderRadius: 0, height: 4 }} />
        </Box>
      ) : null}
    </Paper>
  );
}
