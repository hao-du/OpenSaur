import { Grid, IconButton, Menu, MenuItem, Paper, Stack, Typography } from "@mui/material";
import { Banknote, ChevronDown, Landmark, Repeat, Users } from "lucide-react";
import { X } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { ConfirmModal } from "../../../components/atoms/ConfirmModal";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { DropDown } from "../../../components/atoms/DropDown";
import { useAuthSession } from "../../auth/hooks/AuthContext";
import { useSettings } from "../../settings/provider/SettingProvider";
import { TransactionListPanel } from "../../transactions/components/TransactionListPanel";
import { OfflineCashFlowFormDrawer } from "../components/OfflineCashFlowFormDrawer";
import { OfflineBankAccountFormDrawer } from "../components/OfflineBankAccountFormDrawer";
import { OfflineTransferFormDrawer } from "../components/OfflineTransferFormDrawer";
import { OfflineExchangeFormDrawer } from "../components/OfflineExchangeFormDrawer";
import { OfflineTemplatePopulateDrawer } from "../components/populate/OfflineTemplatePopulateDrawer";
import { useOfflineTransactionsPageLogic } from "../hooks/useOfflineTransactionsPageLogic";

function formatMessage(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replace(`{${key}}`, value),
    template,
  );
}

function typeIcon(templateType: number) {
  if (templateType === 1) return <Banknote size={16} />;
  if (templateType === 2) return <Users size={16} />;
  if (templateType === 3) return <Repeat size={16} />;
  return <Landmark size={16} />;
}

function typeColor(templateType: number) {
  if (templateType === 1) return "var(--tx-type-cashflow-color)";
  if (templateType === 2) return "var(--tx-type-transfer-color)";
  if (templateType === 3) return "var(--tx-type-exchange-color)";
  return "var(--tx-type-bankaccount-color)";
}

export function OfflineTransactionsPage() {
  const { formatAmount, formatDate, t } = useSettings();
  const { authSession } = useAuthSession();
  const navigate = useNavigate();
  const location = useLocation();
  const pageLogic = useOfflineTransactionsPageLogic();
  const {
    banks,
    counterparties,
    currencies,
    deletingTransaction,
    error,
    hasOfflineMetadata,
    hasOfflineTransactions,
    isBankAccountDrawerOpen,
    isCashFlowDrawerOpen,
    isExchangeDrawerOpen,
    isImportingMetadata,
    isSubmittingReview,
    isTemplatePopulateDrawerOpen,
    isTransferDrawerOpen,
    offlineTemplates,
    page,
    pageCount,
    pagedTransactions,
    populateTemplateId,
    selectedTemplateId,
    setCreateMenuAnchor,
    setDeletingTransaction,
    statusMessageKey,
    submitForReview,
    tagOptions,
    templatePickerForm,
    visibleTransactions,
    openCreateDrawer,
    openEditDrawer,
    handlePopulateTemplate,
    closeDrawers,
    saveTransaction,
    createMenuAnchor,
    editingTransaction,
    importMetadata,
    setPage,
    setStatusMessageKey,
    handleDeleteConfirmed,
  } = pageLogic;

  const headerActions = (
    <Stack direction="row" spacing={1} sx={{ flexWrap: "nowrap" }}>
        <ActionButton
          disabled={isImportingMetadata}
          sx={{ px: { xs: 1.5, sm: 2 } }}
          onClick={() => {
            if (authSession == null) {
              navigate("/prepare-session", {
                state: {
                  returnTo: `${location.pathname}?importMetadata=1`,
                },
              });
              return;
            }

            void importMetadata();
          }}
          variant="outlined"
        >
          {isImportingMetadata ? t("offline.importing") : t("offline.importAction")}
        </ActionButton>
        <ActionButton
          disabled={isSubmittingReview || !hasOfflineTransactions || !hasOfflineMetadata}
          sx={{ px: { xs: 1.5, sm: 2 } }}
          onClick={() => {
            if (authSession == null) {
              navigate("/prepare-session", {
                state: {
                  returnTo: `${location.pathname}?submitReview=1`,
                },
              });
              return;
            }

            void submitForReview();
          }}
          variant="outlined"
        >
          {isSubmittingReview ? t("offline.submittingReview") : t("offline.submitForReview")}
        </ActionButton>
      <ActionButton
        disabled={!hasOfflineMetadata}
        endIcon={<ChevronDown size={16} />}
        sx={{ px: { xs: 1.5, sm: 2 } }}
        onClick={(event) => setCreateMenuAnchor(event.currentTarget)}
        variant="contained"
      >
        {t("transactions.create")}
      </ActionButton>
    </Stack>
  );

  return (
    <DefaultLayout
      headerActions={headerActions}
      title={t("offline.transactionsTitle")}
    >
      <Stack spacing={3}>
        {error != null ? (
          <Paper elevation={0} sx={{ border: "1px solid rgba(244,67,54,0.20)", backgroundColor: "rgba(244,67,54,0.06)", p: 2 }}>
            <Typography color="error.main" sx={{ fontWeight: 700 }}>{error}</Typography>
          </Paper>
        ) : null}
        {statusMessageKey != null ? (
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
              {t(statusMessageKey)}
            </Typography>
            <IconButton
              aria-label={t("common.dismissMessage")}
              onClick={() => setStatusMessageKey(null)}
              size="small"
            >
              <X size={16} />
            </IconButton>
          </Paper>
        ) : null}
        {!hasOfflineMetadata ? (
          <Paper elevation={0} sx={{ border: "1px solid rgba(33,150,243,0.20)", backgroundColor: "rgba(33,150,243,0.06)", p: 2 }}>
            <Typography sx={{ fontWeight: 700 }}>{t("offline.importTitle")}</Typography>
            <Typography color="text.secondary">{t("offline.importDescription")}</Typography>
          </Paper>
        ) : null}

        <Grid container spacing={2} sx={{ alignItems: "stretch" }}>
          <Grid size={{ xs: 12, md: 6 }}>
            <TransactionListPanel
              formatAmount={formatAmount}
              formatDate={formatDate}
              isActionDisabled={!hasOfflineMetadata}
              isLoading={false}
              onDelete={(item) => {
                const record = visibleTransactions?.find((transaction) => transaction.id === item.id && transaction.type === item.type);
                if (record != null) {
                  setDeletingTransaction(record);
                }
              }}
              onEdit={(type, id) => {
                const record = visibleTransactions?.find((transaction) => transaction.id === id && transaction.type === type);
                if (record != null) {
                  openEditDrawer(record);
                }
              }}
              onPageChange={setPage}
              page={page}
              pageCount={pageCount}
              pagedTransactions={pagedTransactions}
              t={t}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper sx={{ p: 2, height: "100%" }}>
              <Stack spacing={2}>
                <Paper variant="outlined" sx={{ p: 1.5 }}>
                  <Typography variant="h6">{t("templates.title")}</Typography>
                  <Stack spacing={1} sx={{ mt: 1 }}>
                    <DropDown
                      control={templatePickerForm.control}
                      disabled={!hasOfflineMetadata}
                      filterable
                      label=""
                      name="templateId"
                      placeholder={t("common.pleaseSelect")}
                      options={offlineTemplates.map((template) => ({
                        icon: typeIcon(template.templateType),
                        label: template.name,
                        textColor: typeColor(template.templateType),
                        value: template.id,
                      }))}
                    />
                    <Stack direction="row" sx={{ justifyContent: "flex-end" }}>
                      <ActionButton disabled={!selectedTemplateId || !hasOfflineMetadata} onClick={() => handlePopulateTemplate()}>
                        {t("templates.populate")}
                      </ActionButton>
                    </Stack>
                  </Stack>
                </Paper>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        <Menu
          anchorEl={createMenuAnchor}
          onClose={() => setCreateMenuAnchor(null)}
          open={createMenuAnchor != null}
        >
          <MenuItem
            onClick={() => {
              setCreateMenuAnchor(null);
              openCreateDrawer("CashFlow");
            }}
          >
            {t("transactions.cashFlow")}
          </MenuItem>
          <MenuItem
            onClick={() => {
              setCreateMenuAnchor(null);
              openCreateDrawer("BankAccount");
            }}
          >
            {t("transactions.bankAccount")}
          </MenuItem>
          <MenuItem
            onClick={() => {
              setCreateMenuAnchor(null);
              openCreateDrawer("Transfer");
            }}
          >
            {t("transactions.transfer")}
          </MenuItem>
          <MenuItem
            onClick={() => {
              setCreateMenuAnchor(null);
              openCreateDrawer("Exchange");
            }}
          >
            {t("transactions.exchange")}
          </MenuItem>
        </Menu>

        <ConfirmModal
          confirmLabel={t("transactions.delete")}
          isConfirming={false}
          message={deletingTransaction == null
            ? ""
            : formatMessage(t("offline.deleteConfirmMessage"), {
              description: deletingTransaction.description || t("common.none"),
              type: deletingTransaction.type,
            })}
          onClose={() => setDeletingTransaction(null)}
          onConfirm={() => {
            handleDeleteConfirmed();
          }}
          open={deletingTransaction != null}
          title={t("transactions.deleteTitle")}
        />

        <OfflineCashFlowFormDrawer
          currencies={currencies}
          editingTransaction={editingTransaction?.type === "CashFlow" ? editingTransaction : null}
          isOpen={isCashFlowDrawerOpen}
          onClose={closeDrawers}
          onSave={saveTransaction}
          tagOptions={tagOptions}
        />

        <OfflineBankAccountFormDrawer
          banks={banks}
          currencies={currencies}
          editingTransaction={editingTransaction?.type === "BankAccount" ? editingTransaction : null}
          isOpen={isBankAccountDrawerOpen}
          onClose={closeDrawers}
          onSave={saveTransaction}
          tagOptions={tagOptions}
        />

        <OfflineTransferFormDrawer
          counterparties={counterparties}
          currencies={currencies}
          editingTransaction={editingTransaction?.type === "Transfer" ? editingTransaction : null}
          isOpen={isTransferDrawerOpen}
          onClose={closeDrawers}
          onSave={saveTransaction}
          tagOptions={tagOptions}
        />

        <OfflineExchangeFormDrawer
          currencies={currencies}
          editingTransaction={editingTransaction?.type === "Exchange" ? editingTransaction : null}
          isOpen={isExchangeDrawerOpen}
          onClose={closeDrawers}
          onSave={saveTransaction}
          tagOptions={tagOptions}
        />

        <OfflineTemplatePopulateDrawer
          banks={banks}
          counterparties={counterparties}
          currencies={currencies}
          initialTemplateId={populateTemplateId}
          isOpen={isTemplatePopulateDrawerOpen}
          onClose={closeDrawers}
          onSave={saveTransaction}
        />
      </Stack>
    </DefaultLayout>
  );
}
