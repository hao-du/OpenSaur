import { Alert, Menu, MenuItem, Stack } from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { ChevronDown } from "lucide-react";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { ConfirmModal } from "../../../components/atoms/ConfirmModal";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { getApiErrorMessage } from "../../../infrastructure/http/apiErrorHelpers";
import { useBanksQuery } from "../../banks/hooks/useBanksQuery";
import { useCounterpartiesQuery } from "../../counterparties/hooks/useCounterpartiesQuery";
import { useCurrenciesQuery } from "../../currencies/hooks/useCurrenciesQuery";
import { useSettings } from "../../settings/provider/SettingProvider";
import { useCrudPageState } from "../../../components/hooks/useCrudPageState";
import { getTemplateById } from "../api/templatesApi";
import { TemplateFormDrawer } from "../components/settings/TemplateFormDrawer";
import {
  buildDefaultTemplateData,
  safeParseTemplateData,
  toStoredTemplateData,
} from "../components/settings/TemplateDataCodec";
import { TemplatePopulateDrawer } from "../components/TemplatePopulateDrawer";
import {
  type TemplateFormValues,
} from "../components/settings/TemplateForm";
import { TemplatesFilterDrawer } from "../components/TemplatesFilterDrawer";
import { TemplatesList } from "../components/TemplatesList";
import type { TemplateListItemDto } from "../dtos/TemplateDto";
import { useCreateTemplateMutation } from "../hooks/useCreateTemplateMutation";
import { useDeleteTemplateMutation } from "../hooks/useDeleteTemplateMutation";
import { useTemplatesQuery } from "../hooks/useTemplatesQuery";
import { useUpdateTemplateMutation } from "../hooks/useUpdateTemplateMutation";

const emptyFormState: TemplateFormValues = {
  description: "",
  name: "",
  templateData: buildDefaultTemplateData("CashFlow"),
  templateType: "CashFlow",
};

function mapTypeToNumber(type: TemplateFormValues["templateType"]) {
  if (type === "CashFlow") return 1;
  if (type === "Transfer") return 2;
  if (type === "Exchange") return 3;
  return 4;
}

function validateAutoPopulateFields(templateData: unknown): string | null {
  const validateNode = (node: unknown, path: string): string | null => {
    if (node == null) return null;
    if (Array.isArray(node)) {
      for (let i = 0; i < node.length; i += 1) {
        const error = validateNode(node[i], `${path}[${i}]`);
        if (error != null) return error;
      }
      return null;
    }
    if (typeof node !== "object") return null;

    const field = node as {
      autoPopulate?: boolean;
      showUi?: boolean;
      value?: unknown;
    };
    if (field.autoPopulate === true && field.showUi !== true) {
      if (typeof field.value === "string" && field.value.trim().length === 0) {
        return `Auto populate field '${path}' is required.`;
      }
      if (Array.isArray(field.value) && field.value.length === 0) {
        return `Auto populate field '${path}' is required.`;
      }
      if (field.value == null) {
        return `Auto populate field '${path}' is required.`;
      }
    }

    for (const [key, child] of Object.entries(
      node as Record<string, unknown>,
    )) {
      const childPath = path.length > 0 ? `${path}.${key}` : key;
      const error = validateNode(child, childPath);
      if (error != null) return error;
    }
    return null;
  };

  return validateNode(templateData, "");
}

function mapNumberToType(type: number): TemplateFormValues["templateType"] {
  if (type === 1) return "CashFlow";
  if (type === 2) return "Transfer";
  if (type === 3) return "Exchange";
  return "BankAccount";
}

export function TemplatesPage() {
  const { t } = useSettings();
  const [filters, setFilters] = useState({
    isActive: true,
    name: "",
    templateType: "" as "" | TemplateFormValues["templateType"],
  });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [createMenuAnchor, setCreateMenuAnchor] = useState<null | HTMLElement>(
    null,
  );
  const [isPopulateOpen, setIsPopulateOpen] = useState(false);
  const [populateTemplateId, setPopulateTemplateId] = useState<string | null>(
    null,
  );

  const form = useForm<TemplateFormValues>({ defaultValues: emptyFormState });
  const {
    closeDeleteConfirm,
    closeForm,
    deletingItem: deletingTemplate,
    editingItem: editingTemplate,
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
  } = useCrudPageState<TemplateListItemDto>();

  const { data: templates = [], isLoading } = useTemplatesQuery(filters);
  const createTemplateMutation = useCreateTemplateMutation();
  const updateTemplateMutation = useUpdateTemplateMutation();
  const deleteTemplateMutation = useDeleteTemplateMutation();
  const { data: banks = [] } = useBanksQuery({
    isActive: true,
    name: "",
    shortName: "",
  });
  const { data: counterparties = [] } = useCounterpartiesQuery({
    email: "",
    fullName: "",
    isActive: true,
    phoneNumber: "",
  });
  const { data: currencies = [] } = useCurrenciesQuery({
    isActive: true,
    name: "",
    shortName: "",
  });

  async function handleSubmit(values: TemplateFormValues) {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const autoPopulateValidationError = validateAutoPopulateFields(
        values.templateData,
      );
      if (autoPopulateValidationError != null) {
        throw new Error(autoPopulateValidationError);
      }

      const payload = {
        description:
          values.description.trim().length === 0
            ? null
            : values.description.trim(),
        isActive: editingTemplate?.isActive ?? true,
        name: values.name.trim(),
        templateDataJson: JSON.stringify(
          toStoredTemplateData(values.templateData),
        ),
        templateType: mapTypeToNumber(values.templateType),
      };

      if (editingTemplate == null) {
        await createTemplateMutation.mutateAsync(payload);
      } else {
        await updateTemplateMutation.mutateAsync({
          id: editingTemplate.id,
          payload,
        });
      }

      form.reset(emptyFormState);
      setEditingItem(null);
      setIsFormOpen(false);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t("templates.errorSave")));
    } finally {
      setIsSubmitting(false);
    }
  }

  function openCreateForm(type: TemplateFormValues["templateType"]) {
    form.reset({
      ...emptyFormState,
      templateType: type,
      templateData: buildDefaultTemplateData(type),
    });
    openCrudCreateForm();
  }

  async function openEditForm(template: TemplateListItemDto) {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const detail = await getTemplateById(template.id);
      const type = mapNumberToType(detail.templateType);

      form.reset({
        description: detail.description ?? "",
        name: detail.name,
        templateData: safeParseTemplateData(detail.templateDataJson, type),
        templateType: type,
      });
      openCrudEditForm(template);
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t("templates.errorLoad")));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDeleteConfirmed() {
    if (deletingTemplate == null) {
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await deleteTemplateMutation.mutateAsync(deletingTemplate.id);
      if (editingTemplate?.id === deletingTemplate.id) {
        closeForm();
        form.reset(emptyFormState);
      }
      closeDeleteConfirm();
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, t("templates.errorDelete")));
    } finally {
      setIsSubmitting(false);
    }
  }

  const headerActions = (
    <Stack direction="row" spacing={1.25}>
      <ActionButton
        onClick={() => setIsFilterDrawerOpen(true)}
        variant="outlined"
      >
        {t("templates.filter")}
      </ActionButton>
      <ActionButton
        endIcon={<ChevronDown size={16} />}
        onClick={(event) => setCreateMenuAnchor(event.currentTarget)}
      >
        {t("templates.create")}
      </ActionButton>
      <Menu
        anchorEl={createMenuAnchor}
        onClose={() => setCreateMenuAnchor(null)}
        open={createMenuAnchor != null}
      >
        <MenuItem
          onClick={() => {
            setCreateMenuAnchor(null);
            openCreateForm("CashFlow");
          }}
        >
          {t("templates.templateType.cashFlow")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setCreateMenuAnchor(null);
            openCreateForm("Transfer");
          }}
        >
          {t("templates.templateType.transfer")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setCreateMenuAnchor(null);
            openCreateForm("Exchange");
          }}
        >
          {t("templates.templateType.exchange")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            setCreateMenuAnchor(null);
            openCreateForm("BankAccount");
          }}
        >
          {t("templates.templateType.bankAccount")}
        </MenuItem>
      </Menu>
    </Stack>
  );

  return (
    <DefaultLayout headerActions={headerActions} title={t("templates.title")}>
      <Stack spacing={3}>
        {errorMessage != null ? (
          <Alert severity="error">{errorMessage}</Alert>
        ) : null}
        <TemplatesList
          isLoading={isLoading}
          isSubmitting={isSubmitting}
          onDelete={(template) => openDeleteConfirm(template)}
          onEdit={(template) => {
            void openEditForm(template);
          }}
          onPopulate={(template) => {
            setPopulateTemplateId(template.id);
            setIsPopulateOpen(true);
          }}
          templates={templates}
        />
      </Stack>

      <TemplateFormDrawer
        banks={banks}
        counterparties={counterparties}
        currencies={currencies}
        form={form}
        isEditMode={isEditMode}
        isOpen={isFormOpen}
        isSubmitting={isSubmitting}
        onClose={() => {
          if (isSubmitting) return;
          closeForm();
          form.reset(emptyFormState);
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmModal
        confirmLabel={t("templates.delete")}
        isConfirming={isSubmitting}
        message={
          deletingTemplate == null
            ? ""
            : t("templates.deleteConfirm").replace(
                "{name}",
                deletingTemplate.name,
              )
        }
        onClose={() => {
          if (isSubmitting) return;
          closeDeleteConfirm();
        }}
        onConfirm={() => {
          void handleDeleteConfirmed();
        }}
        open={deletingTemplate !== null}
        title={t("templates.deleteTitle")}
      />

      <TemplatesFilterDrawer
        initialValues={filters}
        isOpen={isFilterDrawerOpen}
        onApply={(values) => {
          setFilters(values);
          setIsFilterDrawerOpen(false);
        }}
        onClose={() => setIsFilterDrawerOpen(false)}
      />

      <TemplatePopulateDrawer
        banks={banks}
        counterparties={counterparties}
        currencies={currencies}
        initialTemplateId={populateTemplateId ?? ""}
        isOpen={isPopulateOpen}
        onClose={() => {
          setIsPopulateOpen(false);
          setPopulateTemplateId(null);
        }}
        onSaved={async () => {}}
      />
    </DefaultLayout>
  );
}
