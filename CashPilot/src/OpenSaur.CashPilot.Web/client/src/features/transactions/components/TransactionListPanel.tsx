import {
  Chip,
  CircularProgress,
  Pagination,
  Paper,
  Stack,
} from "@mui/material";
import {
  Banknote,
  Landmark,
  Pencil,
  Repeat,
  Trash2,
  Users,
} from "lucide-react";
import { BodyText } from "../../../components/atoms/BodyText";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import { loadingSpinnerSize, transactionAmountFontSize } from "../../../infrastructure/constants/uiSizes";
import {
  getBankAccountStatusLabel,
  getBankAccountTransactionTypeLabel,
  getTransferStatusLabel,
  getTransferTypeLabel,
  bankAccountTransactionTypes,
  transactionDirectionValues,
} from "../../../infrastructure/constants/transactionEnums";
import type { TranslationKey } from "../../settings/provider/translations";
import type { TransactionListItemDto } from "../dtos/TransactionDto";
import type { TransactionType } from "../dtos/TransactionPageState";

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

type Props = {
  formatAmount: (value: number) => string;
  formatDate: (value: string | number | Date | null | undefined) => string;
  isLoading: boolean;
  onDelete: (item: TransactionListItemDto) => void;
  onEdit: (type: TransactionType, id: string, transferId?: string | null) => void;
  page: number;
  pageCount: number;
  pagedTransactions: TransactionListItemDto[];
  onPageChange: (page: number) => void;
  t: (key: TranslationKey) => string;
};

function getTransactionTypeTagSx(type: TransactionType) {
  return transactionTypeConfig[type].tagSx;
}

export function TransactionListPanel({
  formatAmount,
  formatDate,
  isLoading,
  onDelete,
  onEdit,
  page,
  pageCount,
  pagedTransactions,
  onPageChange,
  t,
}: Props) {
  return (
    <Paper sx={{ p: 2, height: "100%" }}>
      <Stack spacing={1.25}>
        {isLoading ? (
          <Paper elevation={0} sx={layoutStyles.loadingPanel}>
            <Stack alignItems="center" spacing={2}>
              <CircularProgress size={loadingSpinnerSize} />
              <BodyText>{t("transactions.loading")}</BodyText>
            </Stack>
          </Paper>
        ) : pagedTransactions.length === 0 ? (
          <Paper elevation={0} sx={layoutStyles.emptyStatePanel}>
            <Stack spacing={1}>
              <BodyText sx={{ fontWeight: 700 }}>
                {t("transactions.emptyTitle")}
              </BodyText>
              <BodyText sx={{ color: "text.secondary" }}>
                {t("transactions.emptySubtitle")}
              </BodyText>
            </Stack>
          </Paper>
        ) : (
          pagedTransactions.map((item) => {
            const bankMovementTypeLabel = getBankAccountTransactionTypeLabel(item.bankAccountTransactionType, t);
            const bankStatusLabel = getBankAccountStatusLabel(item.bankAccountStatus, t);
            const transferStatusLabel = getTransferStatusLabel(item.transferStatus, t);
            const transferTypeLabel = getTransferTypeLabel(item.transferType, t);
            const tagSx = getTransactionTypeTagSx(item.type);
            const { className, icon: Icon } = transactionTypeConfig[item.type];

            return (
              <Paper
                key={`${item.type}-${item.id}-${item.transactionDate}-${item.amount}-${item.direction}`}
                variant="outlined"
                sx={{
                  p: 1.1,
                  borderColor:
                    item.type === "BankAccount" &&
                    (item.bankAccountTransactionType === bankAccountTransactionTypes.initialDeposit ||
                      item.bankAccountTransactionType === bankAccountTransactionTypes.principalReturn)
                      ? "success.main"
                      : undefined,
                }}
              >
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="stretch"
                  spacing={2}
                >
                  <Stack spacing={0.25} sx={{ flex: 1, minHeight: 96 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <BodyText sx={{ fontWeight: 700 }}>
                        {formatDate(item.transactionDate)}
                      </BodyText>
                      <span
                        className={`tx-type-icon ${className}`}
                        title={item.type}
                      >
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
                      {item.description ?? "-"}
                    </BodyText>
                    {item.type === "BankAccount" ||
                    item.type === "Transfer" ||
                    (item.tags != null && item.tags.length > 0) ? (
                      <Stack spacing={0.75} sx={{ mt: "auto", pt: 0.75 }}>
                        {item.type === "BankAccount" ? (
                          <Stack
                            direction="row"
                            spacing={0.75}
                            sx={{ flexWrap: "wrap" }}
                          >
                            {item.bankName ? (
                              <Chip
                                size="small"
                                label={item.bankName}
                                variant="outlined"
                                sx={tagSx}
                              />
                            ) : null}
                            {bankStatusLabel ? (
                              <Chip
                                size="small"
                                label={bankStatusLabel}
                                variant="outlined"
                                sx={tagSx}
                              />
                            ) : null}
                            {bankMovementTypeLabel ? (
                              <Chip
                                size="small"
                                label={bankMovementTypeLabel}
                                variant="outlined"
                                sx={tagSx}
                              />
                            ) : null}
                          </Stack>
                        ) : null}
                        {item.type === "Transfer" ? (
                          <Stack
                            direction="row"
                            spacing={0.75}
                            sx={{ flexWrap: "wrap" }}
                          >
                            {item.counterpartyName ? (
                              <Chip
                                size="small"
                                label={item.counterpartyName}
                                variant="outlined"
                                sx={tagSx}
                              />
                            ) : null}
                            {transferStatusLabel ? (
                              <Chip
                                size="small"
                                label={transferStatusLabel}
                                variant="outlined"
                                sx={tagSx}
                              />
                            ) : null}
                            {transferTypeLabel ? (
                              <Chip
                                size="small"
                                label={transferTypeLabel}
                                variant="outlined"
                                sx={tagSx}
                              />
                            ) : null}
                          </Stack>
                        ) : null}
                        {item.tags != null && item.tags.length > 0 ? (
                          <Stack
                            direction="row"
                            spacing={0.75}
                            sx={{ flexWrap: "wrap" }}
                          >
                            {item.tags.map((tag) => (
                              <Chip
                                key={`${item.type}-${item.id}-${tag}`}
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
                    ) : null}
                  </Stack>

                  <Stack spacing={0.5} alignItems="flex-end">
                    <BodyText
                      sx={{
                        color:
                          item.type === "BankAccount" &&
                          (item.bankAccountTransactionType === bankAccountTransactionTypes.initialDeposit ||
                            item.bankAccountTransactionType === bankAccountTransactionTypes.principalReturn)
                          ? "success.main"
                            : item.direction === transactionDirectionValues.inflow
                              ? "primary.main"
                              : "error.main",
                        fontSize: transactionAmountFontSize,
                        lineHeight: 1.1,
                      }}
                    >
                      {formatAmount(item.amount)}
                    </BodyText>
                    <BodyText sx={{ fontWeight: 700 }}>
                      {item.currencyCode}
                    </BodyText>
                    <Stack direction="row" spacing={1}>
                      <ActionButton
                        aria-label={t("transactions.edit")}
                        noWrap={false}
                        onClick={() => {
                          onEdit(item.type, item.id, item.transferId);
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
                        <Pencil size={16} />
                      </ActionButton>
                      <ActionButton
                        aria-label={t("transactions.delete")}
                        color="error"
                        noWrap={false}
                        onClick={() => onDelete(item)}
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
        {!isLoading ? (
          <Stack alignItems="center" sx={{ pt: 0.5 }}>
            <Pagination
              count={pageCount}
              onChange={(_, value) => onPageChange(value)}
              page={page}
              shape="rounded"
              size="small"
            />
          </Stack>
        ) : null}
      </Stack>
    </Paper>
  );
}
