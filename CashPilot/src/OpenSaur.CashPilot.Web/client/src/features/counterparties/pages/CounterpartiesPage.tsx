import { Alert, Stack } from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { ConfirmModal } from "../../../components/atoms/ConfirmModal";
import { useCrudPageState } from "../../../components/hooks/useCrudPageState";
import { getApiErrorMessage } from "../../../infrastructure/http/apiErrorHelpers";
import { useSettings } from "../../settings/provider/SettingProvider";
import { CounterpartiesFilterDrawer } from "../components/CounterpartiesFilterDrawer";
import { CounterpartiesList } from "../components/CounterpartiesList";
import { CounterpartyFormDrawer } from "../components/CounterpartyFormDrawer";
import type { CounterpartyFormValues } from "../components/CounterpartyForm";
import type {
  CounterpartyDto,
  CreateCounterpartyRequestDto,
  UpdateCounterpartyRequestDto,
} from "../dtos/CounterpartyDto";
import { useCreateCounterpartyMutation } from "../hooks/useCreateCounterpartyMutation";
import { useDeleteCounterpartyMutation } from "../hooks/useDeleteCounterpartyMutation";
import { useCounterpartiesQuery } from "../hooks/useCounterpartiesQuery";
import { useUpdateCounterpartyMutation } from "../hooks/useUpdateCounterpartyMutation";

const emptyFormState: CounterpartyFormValues = {
  description: "",
  email: "",
  fullName: "",
  isDefault: false,
  isActive: true,
  phoneNumber: "",
};

export function CounterpartiesPage() {
  const { t } = useSettings();
  const [filters, setFilters] = useState({
    email: "",
    fullName: "",
    isActive: true,
    phoneNumber: "",
  });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const { data: counterparties = [], isLoading } =
    useCounterpartiesQuery(filters);
  const createCounterpartyMutation = useCreateCounterpartyMutation();
  const updateCounterpartyMutation = useUpdateCounterpartyMutation();
  const deleteCounterpartyMutation = useDeleteCounterpartyMutation();
  const {
    closeDeleteConfirm,
    closeForm,
    deletingItem: deletingCounterparty,
    editingItem: editingCounterparty,
    errorMessage,
    isEditMode,
    isFormOpen,
    isSubmitting,
    openCreateForm: openCrudCreateForm,
    openDeleteConfirm,
    openEditForm: openCrudEditForm,
    setEditingItem,
    setErrorMessage,
    setIsFormOpen,
    setIsSubmitting,
  } = useCrudPageState<CounterpartyDto>();
  const form = useForm<CounterpartyFormValues>({
    defaultValues: emptyFormState,
  });

  async function handleSubmit(values: CounterpartyFormValues) {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (editingCounterparty == null) {
        const payload: CreateCounterpartyRequestDto = {
          description:
            values.description.trim().length === 0
              ? null
              : values.description.trim(),
          email: values.email.trim().length === 0 ? null : values.email.trim(),
          fullName: values.fullName.trim(),
          isDefault: values.isDefault,
          phoneNumber:
            values.phoneNumber.trim().length === 0
              ? null
              : values.phoneNumber.trim(),
        };

        await createCounterpartyMutation.mutateAsync(payload);
      } else {
        const payload: UpdateCounterpartyRequestDto = {
          description:
            values.description.trim().length === 0
              ? null
              : values.description.trim(),
          email: values.email.trim().length === 0 ? null : values.email.trim(),
          fullName: values.fullName.trim(),
          isDefault: values.isDefault,
          isActive: values.isActive,
          phoneNumber:
            values.phoneNumber.trim().length === 0
              ? null
              : values.phoneNumber.trim(),
        };

        await updateCounterpartyMutation.mutateAsync({
          id: editingCounterparty.id,
          payload,
        });
      }

      form.reset(emptyFormState);
      setEditingItem(null);
      setIsFormOpen(false);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t("counterparties.errorSave")));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteConfirmed() {
    if (deletingCounterparty == null) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await deleteCounterpartyMutation.mutateAsync(deletingCounterparty.id);
      if (editingCounterparty?.id === deletingCounterparty.id) {
        closeForm();
        form.reset(emptyFormState);
      }
      closeDeleteConfirm();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t("counterparties.errorDelete")));
    } finally {
      setIsSubmitting(false);
    }
  }

  const headerActions = (
    <Stack direction="row" spacing={1.25}>
      <ActionButton
        onClick={() => {
          setIsFilterDrawerOpen(true);
        }}
        variant="outlined"
      >
        {t("common.filter")}
      </ActionButton>
      <ActionButton
        onClick={() => {
          form.reset(emptyFormState);
          openCrudCreateForm();
        }}
      >
        {t("common.create")}
      </ActionButton>
    </Stack>
  );

  return (
    <DefaultLayout
      headerActions={headerActions}
      title={t("counterparties.title")}
    >
      <Stack spacing={3}>
        {errorMessage != null ? (
          <Alert severity="error">{errorMessage}</Alert>
        ) : null}
        <CounterpartiesList
          counterparties={counterparties}
          isLoading={isLoading}
          isSubmitting={isSubmitting}
          onDelete={(counterparty) => {
            openDeleteConfirm(counterparty);
          }}
          onEdit={(counterparty) => {
            form.reset({
              description: counterparty.description ?? "",
              email: counterparty.email ?? "",
              fullName: counterparty.fullName,
              isDefault: counterparty.isDefault,
              isActive: counterparty.isActive,
              phoneNumber: counterparty.phoneNumber ?? "",
            });
            openCrudEditForm(counterparty);
          }}
        />
      </Stack>
      <CounterpartyFormDrawer
        form={form}
        isEditMode={isEditMode}
        isOpen={isFormOpen}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (isSubmitting) {
            return;
          }

          closeForm();
          form.reset(emptyFormState);
        }}
        onSubmit={handleSubmit}
      />
      <ConfirmModal
        confirmLabel={t("counterparties.delete")}
        isConfirming={isSubmitting}
        message={
          deletingCounterparty == null
            ? ""
            : t("counterparties.deleteConfirm").replace(
                "{name}",
                deletingCounterparty.fullName,
              )
        }
        onClose={() => {
          if (isSubmitting) {
            return;
          }

          closeDeleteConfirm();
        }}
        onConfirm={() => {
          void handleDeleteConfirmed();
        }}
        open={deletingCounterparty !== null}
        title={t("counterparties.deleteTitle")}
      />
      <CounterpartiesFilterDrawer
        initialValues={filters}
        isOpen={isFilterDrawerOpen}
        onApply={(values) => {
          setFilters(values);
          setIsFilterDrawerOpen(false);
        }}
        onClose={() => {
          setIsFilterDrawerOpen(false);
        }}
      />
    </DefaultLayout>
  );
}

