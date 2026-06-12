import { useEffect, useState } from "react";
import { Alert, LinearProgress, Paper, Stack, Typography } from "@mui/material";
import { Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { useNetworkStatus } from "../../../infrastructure/offline/useNetworkStatus";
import { loadOfflineMetadataSnapshot } from "../../offline/storages/offlineMetadataStore";
import { syncOfflineMetadata } from "../../offline/services/offlineSyncService";

export function DashboardSyncCard() {
  const navigate = useNavigate();
  const { isOnline } = useNetworkStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  useEffect(() => {
    const snapshot = loadOfflineMetadataSnapshot();
    setLastSyncedAt(snapshot?.savedAt ?? null);
  }, []);

  const handleSync = async () => {
    try {
      setErrorMessage(null);
      setIsSyncing(true);
      const snapshot = await syncOfflineMetadata();
      setLastSyncedAt(snapshot.savedAt);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Sync failed.");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Paper elevation={0} sx={{ border: "1px solid rgba(0,0,0,0.08)", p: 2.5 }}>
      <Stack spacing={2}>
        <Stack spacing={0.5}>
          <Typography variant="h6">Offline sync</Typography>
          <Typography color="text.secondary" variant="body2">
            Download currencies, banks, counterparties, tags and templates for offline use.
          </Typography>
        </Stack>

        {errorMessage != null ? <Alert severity="error">{errorMessage}</Alert> : null}

        <LinearProgress
          variant={isSyncing ? "indeterminate" : "determinate"}
          value={lastSyncedAt != null ? 100 : 0}
        />

        {lastSyncedAt != null ? (
          <Typography color="text.secondary" variant="caption">
            Last synced: {new Date(lastSyncedAt).toLocaleString()}
          </Typography>
        ) : null}

        <Stack direction="row" spacing={1} flexWrap="wrap">
          <ActionButton
            disabled={!isOnline || isSyncing}
            endIcon={<Download size={16} />}
            onClick={() => {
              void handleSync();
            }}
            variant="contained"
          >
            {isSyncing ? "Syncing..." : "Sync"}
          </ActionButton>
          <ActionButton
            onClick={() => {
              navigate("/offline/transactions");
            }}
            variant="outlined"
          >
            Open offline workspace
          </ActionButton>
        </Stack>
      </Stack>
    </Paper>
  );
}
