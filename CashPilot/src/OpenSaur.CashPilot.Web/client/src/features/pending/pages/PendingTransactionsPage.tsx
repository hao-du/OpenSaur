import { Grid, Checkbox, Chip, IconButton, Paper, Stack } from "@mui/material";
import { ArrowDownUp, Banknote, CheckSquare2, Landmark, Pencil, Repeat, Trash2, Users, X } from "lucide-react";
import { BodyText } from "../../../components/atoms/BodyText";
import { LabelText } from "../../../components/atoms/LabelText";
import { MetaText } from "../../../components/atoms/MetaText";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { transactionAmountFontSize } from "../../../infrastructure/constants/uiSizes";
import { useTheme } from "../../../infrastructure/theme/useTheme";
import {
  getBankAccountStatusLabel,
  getBankAccountTransactionTypeLabel,
  getTransferStatusLabel,
  getTransferTypeLabel,
} from "../../../infrastructure/constants/transactionEnums";
import { useSettings } from "../../settings/provider/SettingProvider";
import { bankAccountTransactionTypes, transactionDirectionValues } from "../../../infrastructure/constants/transactionEnums";
import { usePendingTransactionsPageLogic } from "../hooks/usePendingTransactionsPageLogic";

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

function formatTranslation(template: string, count: number) {
  return template.replace("{count}", String(count));
}

export function PendingTransactionsPage() {
  const { t } = useSettings();
  const { layoutStyles } = useTheme();
  const {
    allSelected,
    deleteSelected,
    deleteSubmission,
    dismissError,
    dismissInfo,
    errorMessage,
    formatAmount,
    formatTimestamp,
    infoMessage,
    isBulkDeleting,
    isIndeterminate,
    isLoading,
    isSyncing,
    openSubmissionEditor,
    pendingTransactions,
    renderEditorDrawer,
    selectedCount,
    selectedIds,
    selectedSubmissions,
    setSelectedIds,
    syncSelected,
    toggleSelected,
  } = usePendingTransactionsPageLogic();

  const headerActions = (
    <Stack
      direction="row"
      spacing={1}
      sx={{ flexWrap: "wrap" }}
    >
      <ActionButton
        disabled={selectedCount === 0 || isSyncing}
        endIcon={<ArrowDownUp size={16} />}
        onClick={() => {
          void syncSelected();
        }}
        variant="contained"
      >
        {isSyncing ? t("pendingTransactionsPage.syncing") : t("pendingTransactionsPage.syncSelected")}
      </ActionButton>
      <ActionButton
        color="error"
        disabled={selectedCount === 0 || isBulkDeleting}
        onClick={() => {
          void deleteSelected();
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
        {errorMessage != null ? (
          <Paper elevation={0} sx={layoutStyles.errorBanner}>
            <LabelText color="error.main">
              {errorMessage}
            </LabelText>
            <IconButton
              aria-label={t("common.dismissError")}
              onClick={dismissError}
              size="small"
            >
              <X size={16} />
            </IconButton>
          </Paper>
        ) : null}
        {infoMessage != null ? (
          <Paper elevation={0} sx={layoutStyles.successBanner}>
            <LabelText color="success.main">
              {infoMessage}
            </LabelText>
            <IconButton
              aria-label={t("common.dismissMessage")}
              onClick={dismissInfo}
              size="small"
            >
              <X size={16} />
            </IconButton>
          </Paper>
        ) : null}

        <Grid container spacing={2} sx={{ alignItems: "stretch" }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2, height: "100%" }}>
              <Stack spacing={1.25}>
                <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
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
                    <LabelText sx={{ color: "secondary.main" }}>
                      {isLoading ? t("pendingTransactionsPage.loading") : `${pendingTransactions.length} ${t("common.itemCount")} `}
                    </LabelText>
                  </Stack>
                </Stack>

                {isLoading ? (
                  <Paper elevation={0} sx={layoutStyles.loadingPanel}>
                    <Stack spacing={1} sx={{ alignItems: "center" }}>
                      <BodyText>{t("pendingTransactionsPage.loading")}</BodyText>
                    </Stack>
                  </Paper>
                ) : pendingTransactions.length === 0 ? (
                  <Paper elevation={0} sx={layoutStyles.emptyStatePanel}>
                    <Stack spacing={1} sx={{ alignItems: "center" }}>
                      <CheckSquare2 size={32} />
                      <LabelText>{t("pendingTransactionsPage.noSubmissions")}</LabelText>
                      <MetaText>{t("pendingTransactionsPage.submissionInfo")}</MetaText>
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
                        <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", alignItems: "stretch" }}>
                          <Stack direction="row" spacing={1.5} sx={{ flex: 1, minHeight: 96 }}>
                            <Checkbox
                              checked={isSelected}
                              onChange={(event) => {
                                toggleSelected(submission.id, event.target.checked);
                              }}
                              sx={{ mt: 0.35 }}
                            />
                            <Stack spacing={0.25} sx={{ flex: 1 }}>
                              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
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
                                        sx={layoutStyles.tagChip}
                                      />
                                    ))}
                                  </Stack>
                                ) : null}
                              </Stack>
                            </Stack>
                          </Stack>

                          <Stack spacing={0.5} sx={{ alignItems: "flex-end" }}>
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
                                  void deleteSubmission(submission.id);
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
          <MetaText>
            {formatTranslation(t("pendingTransactionsPage.status"), selectedSubmissions.length)}
          </MetaText>
        ) : null}

        {renderEditorDrawer()}
      </Stack>
    </DefaultLayout>
  );
}
