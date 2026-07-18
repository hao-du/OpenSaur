import { useState } from "react";
import { Alert, Grid, Menu, MenuItem, Stack } from "@mui/material";
import { ChevronDown } from "lucide-react";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { ConfirmModal } from "../../../components/atoms/ConfirmModal";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { useSettings } from "../../settings/provider/SettingProvider";
import { CashFlowFormDrawer } from "../components/CashFlowFormDrawer";
import { BankAccountFormDrawer } from "../components/BankAccountFormDrawer";
import { TransferFormDrawer } from "../components/TransferFormDrawer";
import { ExchangeFormDrawer } from "../components/ExchangeFormDrawer";
import { TransactionDashboardPanel } from "../components/TransactionDashboardPanel";
import { TransactionListPanel } from "../components/TransactionListPanel";
import {
  TransactionsFilterDrawer,
  type TransactionFilterValues,
} from "../components/TransactionsFilterDrawer";
import type { TransactionType } from "../dtos/TransactionPageState";
import { useTransactionsPageLogic } from "../hooks/page/useTransactionsPageLogic";
import { useMarkerTagsQuery } from "../hooks/dashboard/useMarkerTagsQuery";
import { useCashFlowTransactionLogic } from "../hooks/cash-flow/useCashFlowTransactionLogic";
import { useBankAccountTransactionLogic } from "../hooks/bank-account/useBankAccountTransactionLogic";
import { useTransferTransactionLogic } from "../hooks/transfer/useTransferTransactionLogic";
import { useExchangeTransactionLogic } from "../hooks/exchange/useExchangeTransactionLogic";

export function TransactionsPage() {
  const { t } = useSettings();
  const [createMenuAnchor, setCreateMenuAnchor] = useState<null | HTMLElement>(
    null,
  );
  const page = useTransactionsPageLogic();
  const markerTagsQuery = useMarkerTagsQuery();
  const defaultMakerTag = markerTagsQuery.data?.find((tag) => tag.isDefaultMaker);
  const cashFlow = useCashFlowTransactionLogic({
    setErrorMessage: page.setErrorMessage,
  });
  const bankAccount = useBankAccountTransactionLogic({
    setErrorMessage: page.setErrorMessage,
  });
  const transfer = useTransferTransactionLogic({
    setErrorMessage: page.setErrorMessage,
  });
  const exchange = useExchangeTransactionLogic({
    setErrorMessage: page.setErrorMessage,
  });

  const handleEdit = (type: TransactionType, id: string, transferId?: string | null) => {
    if (type === "CashFlow") {
      void cashFlow.openEdit(id);
      return;
    }

    if (type === "BankAccount") {
      void bankAccount.openEdit(id);
      return;
    }

    if (type === "Transfer") {
      void transfer.openEdit(id, transferId ?? undefined);
      return;
    }

    void exchange.openEdit(id);
  };

  const headerActions = (
    <Stack direction="row" spacing={1.25}>
      <ActionButton
        onClick={() => {
          page.setIsFilterDrawerOpen(true);
        }}
        variant="outlined"
      >
        {t("transactions.filter")}
      </ActionButton>
      <ActionButton
        endIcon={<ChevronDown size={16} />}
        onClick={(event) => setCreateMenuAnchor(event.currentTarget)}
        variant="contained"
      >
        {t("transactions.create")}
      </ActionButton>
      <Menu
        anchorEl={createMenuAnchor}
        onClose={() => setCreateMenuAnchor(null)}
        open={createMenuAnchor != null}
      >
        <MenuItem
          onClick={() => {
            setCreateMenuAnchor(null);
            cashFlow.openCreate();
          }}
        >
          {t("transactions.cashFlow")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setCreateMenuAnchor(null);
            bankAccount.openCreate();
          }}
        >
          {t("transactions.bankAccount")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setCreateMenuAnchor(null);
            transfer.openCreate();
          }}
        >
          {t("transactions.transfer")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setCreateMenuAnchor(null);
            exchange.openCreate();
          }}
        >
          {t("transactions.exchange")}
        </MenuItem>
      </Menu>
    </Stack>
  );

  return (
    <DefaultLayout
      headerActions={headerActions}
      title={t("transactions.title")}
    >
      <Stack spacing={3}>
        {page.errorMessage != null ? (
          <Alert severity="error">{page.errorMessage}</Alert>
        ) : null}

        <CashFlowFormDrawer
          currencies={page.currencies}
          editingCashFlow={cashFlow.editingCashFlow}
          isAutoTagging={page.isAutoTagging}
          isOpen={cashFlow.isOpen}
          onClose={cashFlow.close}
          onSubmit={cashFlow.submitCreate}
          onAutoTag={page.requestAutoTags}
          onUpdate={cashFlow.submitUpdate}
        />

        <BankAccountFormDrawer
          banks={page.banks}
          currencies={page.currencies}
          editingBankAccount={bankAccount.editingBankAccount}
          isAutoTagging={page.isAutoTagging}
          isOpen={bankAccount.isOpen}
          onClose={bankAccount.close}
          onCreate={bankAccount.submitCreate}
          onEdit={bankAccount.submitUpdate}
          onAutoTag={page.requestAutoTags}
        />

        <TransferFormDrawer
          counterparties={page.counterparties}
          currencies={page.currencies}
          editingMovement={transfer.editingMovement}
          isAutoTagging={page.isAutoTagging}
          isOpen={transfer.isOpen}
          onClose={transfer.close}
          onCreate={transfer.submitCreate}
          onEdit={transfer.submitUpdate}
          onAutoTag={page.requestAutoTags}
        />

        <ExchangeFormDrawer
          currencies={page.currencies}
          editingExchange={exchange.editingExchange}
          isAutoTagging={page.isAutoTagging}
          isOpen={exchange.isOpen}
          onClose={exchange.close}
          onSubmit={exchange.submitCreate}
          onAutoTag={page.requestAutoTags}
          onUpdate={exchange.submitUpdate}
        />

        <TransactionsFilterDrawer
          initialValues={page.filters}
          isOpen={page.isFilterDrawerOpen}
          onApply={(values: TransactionFilterValues) => {
            page.setFilters(values);
            page.setIsFilterDrawerOpen(false);
          }}
          onClose={() => page.setIsFilterDrawerOpen(false)}
        />

        <ConfirmModal
          confirmLabel={t("transactions.delete")}
          isConfirming={page.isDeleteConfirming}
          message={page.deletingTransaction == null
            ? ""
            : t("transactions.deleteConfirm")
              .replace("{type}", page.deletingTransaction.type)
              .replace("{name}", page.deletingTransaction.description ?? "-")}
          onClose={() => {
            page.closeDeleteConfirm();
          }}
          onConfirm={() => {
            void page.handleDeleteConfirmed();
          }}
          open={page.deletingTransaction != null}
          title={t("transactions.deleteTitle")}
        />

        <Grid container spacing={2} sx={{ alignItems: "stretch" }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TransactionListPanel
              formatAmount={page.formatAmount}
              formatDate={page.formatDate}
              isLoading={page.isTransactionsLoading}
              onDelete={(item) => {
                page.setDeletingTransaction({
                  description: item.description,
                  id: item.id,
                  type: item.type,
                });
              }}
              onEdit={(type, id, transferId) => {
                handleEdit(type, id, transferId);
              }}
              page={page.page}
              pageCount={page.pageCount}
              pagedTransactions={page.pagedTransactions}
              onPageChange={page.setPage}
              t={t}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <TransactionDashboardPanel
              banks={page.banks}
              counterparties={page.counterparties}
              currencies={page.currencies}
              defaultMakerTagName={defaultMakerTag?.name.trim()}
              t={t}
            />
          </Grid>
        </Grid>
      </Stack>
    </DefaultLayout>
  );
}

