import { useEffect, useMemo, useState } from "react";
import {
  Grid,
  Checkbox,
  Chip,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { ArrowDownUp, Banknote, CheckSquare2, Landmark, Pencil, Repeat, Trash2, Users, X } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { BodyText } from "../../../components/atoms/BodyText";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { transactionAmountFontSize } from "../../../infrastructure/constants/uiSizes";
import {
  getBankAccountStatusLabel,
  getBankAccountTransactionTypeLabel,
  getTransferStatusLabel,
  getTransferTypeLabel,
} from "../../../infrastructure/constants/transactionEnums";
import { useBanksQuery } from "../../banks/hooks/useBanksQuery";
import { useCounterpartiesQuery } from "../../counterparties/hooks/useCounterpartiesQuery";
import { useCurrenciesQuery } from "../../currencies/hooks/useCurrenciesQuery";
import { useCurrentProfileQuery } from "../../profile/hooks/useCurrentProfileQuery";
import { useSettings } from "../../settings/provider/SettingProvider";
import type { OfflineTransactionRecord } from "../../offline/storages/offlineTransactionsStore";
import { OfflineCashFlowFormDrawer } from "../../offline/components/OfflineCashFlowFormDrawer";
import { OfflineBankAccountFormDrawer } from "../../offline/components/OfflineBankAccountFormDrawer";
import { OfflineTransferFormDrawer } from "../../offline/components/OfflineTransferFormDrawer";
import { OfflineExchangeFormDrawer } from "../../offline/components/OfflineExchangeFormDrawer";
import { usePendingTransactionsQuery } from "../hooks/usePendingTransactionsQuery";
import { deletePendingTransaction, syncPendingTransactions, updatePendingTransaction } from "../api/pendingTransactionsApi";
import type { PendingTransactionSubmissionDto } from "../dtos/PendingTransactionDto";
import { bankAccountTransactionTypes, transactionDirectionValues } from "../../../infrastructure/constants/transactionEnums";

const transactionTypeConfig = {
  CashFlow: {
    className: "tx-type-cashflow",
    icon: Banknote,
    tagSx: {
      color: "var(--tx-type-cashflow-color)",
      borderColor: "var(--tx-type-cashflow-border)",
      backgroundColor: "var(--tx-type-cashflow-bg)",
    },
  },
  BankAccount: {
    className: "tx-type-bankaccount",
    icon: Landmark,
    tagSx: {
      color: "var(--tx-type-bankaccount-color)",
      borderColor: "var(--tx-type-bankaccount-border)",
      backgroundColor: "var(--tx-type-bankaccount-bg)",
    },
  },
  Transfer: {
    className: "tx-type-transfer",
    icon: Users,
    tagSx: {
      color: "var(--tx-type-transfer-color)",
      borderColor: "var(--tx-type-transfer-border)",
      backgroundColor: "var(--tx-type-transfer-bg)",
    },
  },
  Exchange: {
    className: "tx-type-exchange",
    icon: Repeat,
    tagSx: {
      color: "var(--tx-type-exchange-color)",
      borderColor: "var(--tx-type-exchange-border)",
      backgroundColor: "var(--tx-type-exchange-bg)",
    },
  },
} as const;

function formatTimestamp(value: string | null | undefined) {
  if (value == null || value.length === 0) {
    return "-";
  }

  return new Date(value).toLocaleString();
}

function formatAmount(value: number) {
  return value.toLocaleString();
}

function formatTranslation(template: string, count: number) {
  return template.replace("{count}", String(count));
}

export function PendingTransactionsPage() {
  const { t } = useSettings();
  const { data: currentProfile } = useCurrentProfileQuery();
  const { data: pendingTransactions = [], isLoading, refetch } = usePendingTransactionsQuery();
  const { data: currencies = [] } = useCurrenciesQuery({ isActive: true, name: "", shortName: "" });
  const { data: banks = [] } = useBanksQuery({ isActive: true, name: "", shortName: "" });
  const { data: counterparties = [] } = useCounterpartiesQuery({ email: "", fullName: "", isActive: true, phoneNumber: "" });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editingSubmission, setEditingSubmission] = useState<PendingTransactionSubmissionDto | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const refreshPendingTransactions = async () => {
    await refetch();
  };

  const updateMutation = useMutation({
    mutationFn: async (payload: { id: string; record: Omit<OfflineTransactionRecord, "updatedAt"> }) => {
      const nextRecord: OfflineTransactionRecord = {
        ...payload.record,
        updatedAt: new Date().toISOString(),
        userId: currentProfile?.id ?? payload.record.userId,
      };
      await updatePendingTransaction(payload.id, nextRecord);
    },
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : t("pendingTransactionsPage.updateError"));
    },
    onSuccess: async () => {
      setErrorMessage(null);
      await refreshPendingTransactions();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePendingTransaction,
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : t("pendingTransactionsPage.errorDeleting"));
    },
    onSuccess: async (_, deletedId) => {
      setErrorMessage(null);
      setSelectedIds((current) => current.filter((id) => id !== deletedId));
      await refreshPendingTransactions();
    },
  });

  const syncMutation = useMutation({
    mutationFn: syncPendingTransactions,
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : t("pendingTransactionsPage.syncError"));
    },
    onSuccess: async (result) => {
      setErrorMessage(null);
      setInfoMessage(formatTranslation(t("pendingTransactionsPage.syncSuccess"), result.synced));
      if (result.failed > 0) {
        setErrorMessage(formatTranslation(t("pendingTransactionsPage.syncFailed"), result.failed));
      }
      setSelectedIds([]);
      await refreshPendingTransactions();
    },
  });

  useEffect(() => {
    setSelectedIds((current) => current.filter((id) => pendingTransactions.some((item) => item.id === id)));
  }, [pendingTransactions]);

  const selectedCount = selectedIds.length;
  const allSelected = pendingTransactions.length > 0 && selectedCount === pendingTransactions.length;
  const isIndeterminate = selectedCount > 0 && selectedCount < pendingTransactions.length;
  const selectedSubmissions = useMemo(
    () => pendingTransactions.filter((submission) => selectedIds.includes(submission.id)),
    [pendingTransactions, selectedIds],
  );

  const toggleSelected = (submissionId: string, checked: boolean) => {
    setSelectedIds((current) => {
      if (checked) {
        return current.includes(submissionId) ? current : [...current, submissionId];
      }

      return current.filter((id) => id !== submissionId);
    });
  };

  const openSubmissionEditor = (submission: PendingTransactionSubmissionDto) => {
    setEditingSubmission(submission);
  };

  const closeEditor = () => {
    setEditingSubmission(null);
  };

  const handleSaveSubmission = (record: Omit<OfflineTransactionRecord, "updatedAt">) => {
    if (editingSubmission == null) {
      return;
    }

    void updateMutation.mutateAsync({
      id: editingSubmission.id,
      record,
    });
  };

  const renderEditorDrawer = (type: OfflineTransactionRecord["type"]) => {
    if (editingSubmission?.payload.type !== type) {
      return null;
    }

    const transaction = editingSubmission.payload;
    const isOpen = editingSubmission != null && editingSubmission.payload.type === type;

    if (type === "CashFlow") {
      return (
        <OfflineCashFlowFormDrawer
          currencies={currencies}
          editingTransaction={transaction}
          isOpen={isOpen}
          onClose={closeEditor}
          onSave={handleSaveSubmission}
        />
      );
    }

    if (type === "BankAccount") {
      return (
        <OfflineBankAccountFormDrawer
          banks={banks}
          currencies={currencies}
          editingTransaction={transaction}
          isOpen={isOpen}
          onClose={closeEditor}
          onSave={handleSaveSubmission}
        />
      );
    }

    if (type === "Transfer") {
      return (
        <OfflineTransferFormDrawer
          counterparties={counterparties}
          currencies={currencies}
          editingTransaction={transaction}
          isOpen={isOpen}
          onClose={closeEditor}
          onSave={handleSaveSubmission}
        />
      );
    }

    return (
      <OfflineExchangeFormDrawer
        currencies={currencies}
        editingTransaction={transaction}
        isOpen={isOpen}
        onClose={closeEditor}
        onSave={handleSaveSubmission}
      />
    );
  };

  const headerActions = (
    <Stack
      direction="row"
      flexWrap="wrap"
      spacing={1}
      useFlexGap
    >
      <ActionButton
        disabled={selectedCount === 0 || syncMutation.isPending}
        endIcon={<ArrowDownUp size={16} />}
        onClick={() => {
          void syncMutation.mutateAsync(selectedIds);
        }}
        variant="contained"
      >
        {syncMutation.isPending ? t("pendingTransactionsPage.syncing") : t("pendingTransactionsPage.syncSelected")}
      </ActionButton>
      <ActionButton
        color="error"
        disabled={selectedCount === 0 || isBulkDeleting}
        onClick={() => {
          void (async () => {
            try {
              setErrorMessage(null);
              setIsBulkDeleting(true);
              await Promise.all(selectedIds.map((id) => deletePendingTransaction(id)));
              setSelectedIds([]);
              await refreshPendingTransactions();
            } catch (error) {
              setErrorMessage(error instanceof Error ? error.message : t("pendingTransactionsPage.errorDeleting"));
            } finally {
              setIsBulkDeleting(false);
            }
          })();
        }}
        variant="outlined"
      >
        {isBulkDeleting ? t("pendingTransactionsPage.deleting") : t("pendingTransactionsPage.deleteSelected")}
      </ActionButton>
    </Stack>
  );

  return (
    <DefaultLayout
      headerActions={headerActions}
      title={t("pendingTransactionsPage.title")}
    >
      <Stack spacing={3}>
        <Typography variant="h4">{t("pendingTransactionsPage.title")}</Typography>
        {errorMessage != null ? (
          <Paper
            elevation={0}
            sx={{
              alignItems: "center",
              border: "1px solid rgba(244,67,54,0.20)",
              backgroundColor: "rgba(244,67,54,0.06)",
              display: "flex",
              justifyContent: "space-between",
              p: 2,
            }}
          >
            <Typography color="error.main" sx={{ fontWeight: 700 }}>
              {errorMessage}
            </Typography>
            <IconButton
              aria-label={t("common.dismissError")}
              onClick={() => setErrorMessage(null)}
              size="small"
            >
              <X size={16} />
            </IconButton>
          </Paper>
        ) : null}
        {infoMessage != null ? (
          <Paper
            elevation={0}
            sx={{
              alignItems: "center",
              border: "1px solid rgba(76,175,80,0.20)",
              backgroundColor: "rgba(76,175,80,0.06)",
              display: "flex",
              justifyContent: "space-between",
              p: 2,
            }}
          >
            <Typography color="success.main" sx={{ fontWeight: 700 }}>
              {infoMessage}
            </Typography>
            <IconButton
              aria-label={t("common.dismissMessage")}
              onClick={() => setInfoMessage(null)}
              size="small"
            >
              <X size={16} />
            </IconButton>
          </Paper>
        ) : null}

        <Grid container spacing={2} alignItems="stretch">
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2, height: "100%" }}>
              <Stack spacing={1.25}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Checkbox
                      checked={allSelected}
                      indeterminate={isIndeterminate}
                      onChange={(event) => {
                        if (event.target.checked) {
                          setSelectedIds(pendingTransactions.map((item) => item.id));
                        } else {
                          setSelectedIds([]);
                        }
                      }}
                    />
                    <Typography sx={{ fontWeight: 700 }}>
                      {isLoading ? t("pendingTransactionsPage.loading") : `${pendingTransactions.length} ${t("common.itemCount")} `}
                    </Typography>
                  </Stack>
                </Stack>

                {isLoading ? (
                  <Paper elevation={0} sx={{ border: "1px solid rgba(0,0,0,0.08)", p: 3 }}>
                    <Stack alignItems="center" spacing={1}>
                      <Typography color="text.secondary">{t("pendingTransactionsPage.loading")}</Typography>
                    </Stack>
                  </Paper>
                ) : pendingTransactions.length === 0 ? (
                  <Paper elevation={0} sx={{ border: "1px dashed rgba(33,150,243,0.20)", p: 4 }}>
                    <Stack alignItems="center" spacing={1}>
                      <CheckSquare2 size={32} />
                      <Typography sx={{ fontWeight: 700 }}>{t("pendingTransactionsPage.noSubmissions")}</Typography>
                      <Typography color="text.secondary" variant="body2">{t("pendingTransactionsPage.submissionInfo")}</Typography>
                    </Stack>
                  </Paper>
                ) : (
                  pendingTransactions.map((submission) => {
                    const record = submission.payload;
                    const isSelected = selectedIds.includes(submission.id);
                    const { icon: Icon, tagSx } = transactionTypeConfig[record.type];
                    const bankMovementTypeLabel = getBankAccountTransactionTypeLabel(record.bankAccountTransactionType, t);
                    const bankStatusLabel = getBankAccountStatusLabel(record.bankAccountStatus, t);
                    const transferStatusLabel = getTransferStatusLabel(record.transferStatus, t);
                    const transferTypeLabel = getTransferTypeLabel(record.transferType, t);
                    const tags = record.tags ?? [];

                    return (
                      <Paper
                        key={submission.id}
                        variant="outlined"
                        sx={{
                          p: 1.1,
                          borderColor: isSelected ? "primary.main" : undefined,
                        }}
                      >
                        <Stack direction="row" justifyContent="space-between" alignItems="stretch" spacing={2}>
                          <Stack direction="row" spacing={1.5} sx={{ flex: 1, minHeight: 96 }}>
                            <Checkbox
                              checked={isSelected}
                              onChange={(event) => {
                                toggleSelected(submission.id, event.target.checked);
                              }}
                              sx={{ mt: 0.35 }}
                            />
                            <Stack spacing={0.25} sx={{ flex: 1 }}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <BodyText sx={{ fontWeight: 700 }}>
                                  {formatTimestamp(record.transactionDate)}
                                </BodyText>
                                <span className={`tx-type-icon ${transactionTypeConfig[record.type].className}`} title={record.type}>
                                  <Icon size={16} />
                                </span>
                              </Stack>
                              <BodyText
                                sx={{
                                  color: "text.secondary",
                                  fontSize: "0.9rem",
                                  fontWeight: 400,
                                  opacity: 0.8,
                                }}
                              >
                                {record.description || t("common.none")}
                              </BodyText>
                              <Stack spacing={0.75} sx={{ mt: "auto", pt: 0.75 }}>
                                {record.type === "BankAccount" ? (
                                  <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap" }}>
                                    {record.bankName ? <Chip size="small" label={record.bankName} variant="outlined" sx={tagSx} /> : null}
                                    {bankStatusLabel ? <Chip size="small" label={bankStatusLabel} variant="outlined" sx={tagSx} /> : null}
                                    {bankMovementTypeLabel ? <Chip size="small" label={bankMovementTypeLabel} variant="outlined" sx={tagSx} /> : null}
                                  </Stack>
                                ) : null}
                                {record.type === "Transfer" ? (
                                  <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap" }}>
                                    {record.counterpartyName ? <Chip size="small" label={record.counterpartyName} variant="outlined" sx={tagSx} /> : null}
                                    {transferStatusLabel ? <Chip size="small" label={transferStatusLabel} variant="outlined" sx={tagSx} /> : null}
                                    {transferTypeLabel ? <Chip size="small" label={transferTypeLabel} variant="outlined" sx={tagSx} /> : null}
                                  </Stack>
                                ) : null}
                                {tags.length > 0 ? (
                                  <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap" }}>
                                    {tags.map((tag) => (
                                      <Chip
                                        key={`${submission.id}-${tag}`}
                                        label={tag}
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                          color: "secondary.main",
                                          borderColor: "rgba(255,138,76,0.28)",
                                          backgroundColor: "rgba(255,138,76,0.10)",
                                          fontWeight: 600,
                                        }}
                                      />
                                    ))}
                                  </Stack>
                                ) : null}
                              </Stack>
                            </Stack>
                          </Stack>

                          <Stack spacing={0.5} alignItems="flex-end">
                            <BodyText
                              sx={{
                                color:
                                  record.type === "BankAccount" &&
                                  (record.bankAccountTransactionType === bankAccountTransactionTypes.initialDeposit ||
                                    record.bankAccountTransactionType === bankAccountTransactionTypes.principalReturn)
                                    ? "success.main"
                                    : record.direction === transactionDirectionValues.inflow
                                      ? "primary.main"
                                      : "error.main",
                                fontSize: transactionAmountFontSize,
                                lineHeight: 1.1,
                              }}
                            >
                              {formatAmount(record.amount)}
                            </BodyText>
                            <BodyText sx={{ fontWeight: 700 }}>
                              {record.currencyCode}
                            </BodyText>
                            <Stack direction="row" spacing={1}>
                              <ActionButton
                                aria-label={t("common.edit")}
                                onClick={() => openSubmissionEditor(submission)}
                                size="small"
                                sx={{
                                  borderRadius: "50%",
                                  minHeight: 34,
                                  minWidth: 34,
                                  width: 34,
                                  height: 34,
                                  p: 0,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                                variant="outlined"
                              >
                                <Pencil size={16} />
                              </ActionButton>
                              <ActionButton
                                aria-label={t("common.delete")}
                                color="error"
                                onClick={() => {
                                  void deleteMutation.mutateAsync(submission.id);
                                }}
                                size="small"
                                sx={{
                                  borderRadius: "50%",
                                  minHeight: 34,
                                  minWidth: 34,
                                  width: 34,
                                  height: 34,
                                  p: 0,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                                variant="outlined"
                              >
                                <Trash2 size={16} />
                              </ActionButton>
                            </Stack>
                          </Stack>
                        </Stack>
                      </Paper>
                    );
                  })
                )}
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {selectedSubmissions.length > 0 ? (
          <Typography color="text.secondary" variant="body2">
            {formatTranslation(t("pendingTransactionsPage.status"), selectedSubmissions.length)}
          </Typography>
        ) : null}

        {renderEditorDrawer("CashFlow")}
        {renderEditorDrawer("BankAccount")}
        {renderEditorDrawer("Transfer")}
        {renderEditorDrawer("Exchange")}
      </Stack>
    </DefaultLayout>
  );
}
