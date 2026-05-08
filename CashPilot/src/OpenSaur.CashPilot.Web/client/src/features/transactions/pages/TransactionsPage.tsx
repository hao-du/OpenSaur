import { Alert, Menu, MenuItem, Stack } from "@mui/material";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import { AxiosError } from "axios";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { ConfirmationDialog } from "../../../components/organisms/ConfirmationDialog";
import { layoutStyles } from "../../../infrastructure/theme/theme";
import { useSettings } from "../../settings/provider/SettingProvider";
import { getCurrencies } from "../../currencies/api/currenciesApi";
import { createCashFlow, deleteCashFlow, updateCashFlow } from "../api/transactionsApi";
import { TransactionFormDrawer } from "../components/TransactionFormDrawer";
import { TransactionsList } from "../components/TransactionsList";
import type { CashFlowFormValues } from "../components/TransactionForm";
import type { TransactionDto, UpsertCashFlowRequestDto } from "../dtos/TransactionDto";
import { useTransactionsQuery } from "../hooks/useTransactionsQuery";

const emptyFormState: CashFlowFormValues = {
  amount: "",
  currencyId: "",
  description: "",
  isIncome: false,
  transactedOn: ""
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof AxiosError) {
    const detail = error.response?.data;
    if (typeof detail === "string" && detail.trim().length > 0) {
      return detail;
    }
  }

  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return fallback;
}

function toDateTimeLocalValue(date: string) {
  const parsedDate = new Date(date);
  const offset = parsedDate.getTimezoneOffset();
  const localDate = new Date(parsedDate.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
}

function getCurrentDateTimeLocalValue() {
  return toDateTimeLocalValue(new Date().toISOString());
}

function parseAmountInput(value: string) {
  return Number(value.replace(/,/g, "").trim());
}

function formatAmountDisplay(value: number) {
  return value.toLocaleString("en-US", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  });
}

export function TransactionsPage() {
  const { t } = useSettings();
  const { data: transactions = [], isLoading, refetch } = useTransactionsQuery();
  const [currencyOptions, setCurrencyOptions] = useState<{ isDefault: boolean; label: string; value: string; }[]>([]);
  const [editingTransaction, setEditingTransaction] = useState<TransactionDto | null>(null);
  const [deletingTransaction, setDeletingTransaction] = useState<TransactionDto | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCurrencies, setIsLoadingCurrencies] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [createMenuAnchor, setCreateMenuAnchor] = useState<HTMLElement | null>(null);
  const form = useForm<CashFlowFormValues>({
    defaultValues: emptyFormState
  });
  const isEditMode = useMemo(() => editingTransaction != null, [editingTransaction]);
  const isCreateMenuOpen = createMenuAnchor != null;

  async function ensureCurrenciesLoaded() {
    if (currencyOptions.length > 0) {
      return currencyOptions;
    }

    setIsLoadingCurrencies(true);

    try {
      const currencies = await getCurrencies({
        isActive: true,
        name: "",
        shortName: ""
      });

      const options = currencies.map(currency => ({
        isDefault: currency.isDefault,
        label: `${currency.shortName} - ${currency.name}`,
        value: currency.id
      }));
      setCurrencyOptions(options);
      return options;
    } catch (error) {
      setErrorMessage(getErrorMessage(error, t("transactions.errorLoadCurrencies")));
      return [];
    } finally {
      setIsLoadingCurrencies(false);
    }
  }

  async function handleSubmit(values: CashFlowFormValues) {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const payload: UpsertCashFlowRequestDto = {
        amount: parseAmountInput(values.amount),
        currencyId: values.currencyId,
        description: values.description.trim().length === 0 ? null : values.description.trim(),
        isIncome: values.isIncome,
        transactedOn: new Date(values.transactedOn).toISOString()
      };

      if (editingTransaction == null) {
        await createCashFlow(payload);
      } else {
        await updateCashFlow(editingTransaction.id, payload);
      }

      form.reset(emptyFormState);
      setEditingTransaction(null);
      setIsFormOpen(false);
      await refetch();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, t("transactions.errorSave")));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function openCreateForm() {
    setEditingTransaction(null);
    form.reset({
      ...emptyFormState,
      transactedOn: getCurrentDateTimeLocalValue()
    });
    const options = await ensureCurrenciesLoaded();
    const defaultOption = options.find(option => option.isDefault) ?? options[0];
    if (defaultOption != null) {
      form.setValue("currencyId", defaultOption.value, { shouldDirty: false, shouldValidate: true });
    }
    setIsFormOpen(true);
  }

  async function openEditForm(transaction: TransactionDto) {
    setEditingTransaction(transaction);
    form.reset({
      amount: formatAmountDisplay(transaction.amount),
      currencyId: transaction.currencyId,
      description: transaction.description ?? "",
      isIncome: transaction.isIncome,
      transactedOn: toDateTimeLocalValue(transaction.transactedOn)
    });
    await ensureCurrenciesLoaded();
    setIsFormOpen(true);
  }

  async function handleDeleteConfirmed() {
    if (deletingTransaction == null) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await deleteCashFlow(deletingTransaction.id);
      if (editingTransaction?.id === deletingTransaction.id) {
        setEditingTransaction(null);
        form.reset(emptyFormState);
        setIsFormOpen(false);
      }
      await refetch();
      setDeletingTransaction(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, t("transactions.errorDelete")));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DefaultLayout subtitle={t("transactions.subtitle")} title={t("transactions.title")}>
      <Stack spacing={3}>
        <Stack direction={{ md: "row", xs: "column" }} justifyContent="flex-end" spacing={2}>
          <ActionButton
            endIcon={<ExpandMoreRoundedIcon fontSize="small" />}
            noWrap={false}
            onClick={event => {
              setCreateMenuAnchor(event.currentTarget);
            }}
            sx={layoutStyles.responsiveActionButton}
          >
            {t("transactions.create")}
          </ActionButton>
          <Menu
            anchorEl={createMenuAnchor}
            onClose={() => {
              setCreateMenuAnchor(null);
            }}
            open={isCreateMenuOpen}
          >
            <MenuItem
              onClick={() => {
                setCreateMenuAnchor(null);
                void openCreateForm();
              }}
            >
              {t("transactions.createCashFlow")}
            </MenuItem>
          </Menu>
        </Stack>
        {errorMessage != null ? <Alert severity="error">{errorMessage}</Alert> : null}
        <TransactionsList
          isLoading={isLoading}
          isSubmitting={isSubmitting}
          onDelete={transaction => {
            setDeletingTransaction(transaction);
          }}
          onEdit={transaction => {
            void openEditForm(transaction);
          }}
          transactions={transactions}
        />
      </Stack>
      <TransactionFormDrawer
        currencyOptions={currencyOptions}
        form={form}
        isEditMode={isEditMode}
        isOpen={isFormOpen}
        isSubmitting={isSubmitting || isLoadingCurrencies}
        onClose={() => {
          if (isSubmitting) {
            return;
          }

          setIsFormOpen(false);
          setEditingTransaction(null);
          form.reset(emptyFormState);
        }}
        onSubmit={handleSubmit}
      />
      <ConfirmationDialog
        confirmLabel={t("transactions.delete")}
        isConfirming={isSubmitting}
        message={deletingTransaction == null
          ? ""
          : t("transactions.deleteConfirm").replace("{name}", `${deletingTransaction.currencyName} ${deletingTransaction.amount}`)}
        onClose={() => {
          if (isSubmitting) {
            return;
          }

          setDeletingTransaction(null);
        }}
        onConfirm={() => {
          void handleDeleteConfirmed();
        }}
        open={deletingTransaction !== null}
        title={t("transactions.deleteTitle")}
      />
    </DefaultLayout>
  );
}
