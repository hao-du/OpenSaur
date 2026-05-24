import { Alert, Menu, MenuItem, Stack } from "@mui/material";
import { AxiosError } from "axios";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { ChevronDown } from "lucide-react";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { ConfirmModal } from "../../../components/atoms/ConfirmModal";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { useBanksQuery } from "../../banks/hooks/useBanksQuery";
import { useCounterpartiesQuery } from "../../counterparties/hooks/useCounterpartiesQuery";
import { useCurrenciesQuery } from "../../currencies/hooks/useCurrenciesQuery";
import { useSettings } from "../../settings/provider/SettingProvider";
import { createTemplate, deleteTemplate, getTemplateById, updateTemplate } from "../api/templatesApi";
import { TemplateFormDrawer } from "../components/TemplateFormDrawer";
import { buildDefaultTemplateData, safeParseTemplateData, toStoredTemplateData, type TemplateFormValues } from "../components/TemplateForm";
import { TemplatesFilterDrawer } from "../components/TemplatesFilterDrawer";
import { TemplatesList } from "../components/TemplatesList";
import type { TemplateListItemDto } from "../dtos/TemplateDto";
import { useTemplatesQuery } from "../hooks/useTemplatesQuery";

const emptyFormState: TemplateFormValues = {
  description: "",
  name: "",
  templateData: buildDefaultTemplateData("CashFlow"),
  templateType: "CashFlow"
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

    const field = node as { autoPopulate?: boolean; value?: unknown };
    if (field.autoPopulate === true) {
      if (typeof field.value === "string" && field.value.trim().length === 0) {
        return `Auto populate field '${path}' is required.`;
      }
      if (field.value == null) {
        return `Auto populate field '${path}' is required.`;
      }
    }

    for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
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
  const [filters, setFilters] = useState({ isActive: true, name: "", templateType: "" as "" | TemplateFormValues["templateType"] });
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateListItemDto | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<TemplateListItemDto | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [createMenuAnchor, setCreateMenuAnchor] = useState<null | HTMLElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useForm<TemplateFormValues>({ defaultValues: emptyFormState });
  const isEditMode = useMemo(() => editingTemplate != null, [editingTemplate]);

  const { data: templates = [], isLoading, refetch } = useTemplatesQuery(filters);
  const { data: banks = [] } = useBanksQuery({ isActive: true, name: "", shortName: "" });
  const { data: counterparties = [] } = useCounterpartiesQuery({ email: "", fullName: "", isActive: true, phoneNumber: "" });
  const { data: currencies = [] } = useCurrenciesQuery({ isActive: true, name: "", shortName: "" });

  async function handleSubmit(values: TemplateFormValues) {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const autoPopulateValidationError = validateAutoPopulateFields(values.templateData);
      if (autoPopulateValidationError != null) {
        throw new Error(autoPopulateValidationError);
      }

      const payload = {
        description: values.description.trim().length === 0 ? null : values.description.trim(),
        isActive: editingTemplate?.isActive ?? true,
        name: values.name.trim(),
        templateDataJson: JSON.stringify(toStoredTemplateData(values.templateData)),
        templateType: mapTypeToNumber(values.templateType)
      };

      if (editingTemplate == null) {
        await createTemplate(payload);
      } else {
        await updateTemplate(editingTemplate.id, payload);
      }

      form.reset(emptyFormState);
      setEditingTemplate(null);
      setIsFormOpen(false);
      await refetch();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, t("templates.errorSave")));
    } finally {
      setIsSubmitting(false);
    }
  }

  function openCreateForm(type: TemplateFormValues["templateType"]) {
    setEditingTemplate(null);
    form.reset({ ...emptyFormState, templateType: type, templateData: buildDefaultTemplateData(type) });
    setIsFormOpen(true);
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
        templateType: type
      });
      setEditingTemplate(template);
      setIsFormOpen(true);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, t("templates.errorLoad")));
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
      await deleteTemplate(deletingTemplate.id);
      if (editingTemplate?.id === deletingTemplate.id) {
        setEditingTemplate(null);
        form.reset(emptyFormState);
        setIsFormOpen(false);
      }
      await refetch();
      setDeletingTemplate(null);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, t("templates.errorDelete")));
    } finally {
      setIsSubmitting(false);
    }
  }

  const headerActions = (
    <Stack direction="row" spacing={1.25}>
      <ActionButton onClick={() => setIsFilterDrawerOpen(true)} variant="outlined">{t("templates.filter")}</ActionButton>
      <ActionButton endIcon={<ChevronDown size={16} />} onClick={event => setCreateMenuAnchor(event.currentTarget)}>{t("templates.create")}</ActionButton>
      <Menu anchorEl={createMenuAnchor} onClose={() => setCreateMenuAnchor(null)} open={createMenuAnchor != null}>
        <MenuItem onClick={() => { setCreateMenuAnchor(null); openCreateForm("CashFlow"); }}>{t("templates.templateType.cashFlow")}</MenuItem>
        <MenuItem onClick={() => { setCreateMenuAnchor(null); openCreateForm("Transfer"); }}>{t("templates.templateType.transfer")}</MenuItem>
        <MenuItem onClick={() => { setCreateMenuAnchor(null); openCreateForm("Exchange"); }}>{t("templates.templateType.exchange")}</MenuItem>
        <MenuItem onClick={() => { setCreateMenuAnchor(null); openCreateForm("BankAccount"); }}>{t("templates.templateType.bankAccount")}</MenuItem>
      </Menu>
    </Stack>
  );

  return (
    <DefaultLayout headerActions={headerActions} title={t("templates.title")}>
      <Stack spacing={3}>
        {errorMessage != null ? <Alert severity="error">{errorMessage}</Alert> : null}
        <TemplatesList
          isLoading={isLoading}
          isSubmitting={isSubmitting}
          onDelete={template => setDeletingTemplate(template)}
          onEdit={template => { void openEditForm(template); }}
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
          setIsFormOpen(false);
          setEditingTemplate(null);
          form.reset(emptyFormState);
        }}
        onSubmit={handleSubmit}
      />

      <ConfirmModal
        confirmLabel={t("templates.delete")}
        isConfirming={isSubmitting}
        message={deletingTemplate == null ? "" : t("templates.deleteConfirm").replace("{name}", deletingTemplate.name)}
        onClose={() => {
          if (isSubmitting) return;
          setDeletingTemplate(null);
        }}
        onConfirm={() => { void handleDeleteConfirmed(); }}
        open={deletingTemplate !== null}
        title={t("templates.deleteTitle")}
      />

      <TemplatesFilterDrawer
        initialValues={filters}
        isOpen={isFilterDrawerOpen}
        onApply={values => {
          setFilters(values);
          setIsFilterDrawerOpen(false);
        }}
        onClose={() => setIsFilterDrawerOpen(false)}
      />
    </DefaultLayout>
  );
}



