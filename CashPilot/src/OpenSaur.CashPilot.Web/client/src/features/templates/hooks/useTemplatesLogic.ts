import { useForm } from "react-hook-form";
import { useState } from "react";
import { useCrudPageState } from "../../../components/hooks/useCrudPageState";
import { getApiErrorMessage } from "../../../infrastructure/http/apiErrorHelpers";
import { useBanksQuery } from "../../banks/hooks/useBanksQuery";
import { useCounterpartiesQuery } from "../../counterparties/hooks/useCounterpartiesQuery";
import { useCurrenciesQuery } from "../../currencies/hooks/useCurrenciesQuery";
import { useSettings } from "../../settings/provider/SettingProvider";
import { getTemplateById } from "../api/templatesApi";
import type { TemplateFilterParams, TemplateListItemDto, UpsertTemplateRequestDto } from "../dtos/TemplateDto";
import { useCreateTemplateMutation } from "./useCreateTemplateMutation";
import { useDeleteTemplateMutation } from "./useDeleteTemplateMutation";
import { useTemplatesQuery } from "./useTemplatesQuery";
import { useUpdateTemplateMutation } from "./useUpdateTemplateMutation";
import { buildDefaultTemplateData, safeParseTemplateData, toStoredTemplateData } from "../components/settings/TemplateDataCodec";
import type { TemplateFormValues } from "../components/settings/TemplateForm";

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

function mapNumberToType(type: number): TemplateFormValues["templateType"] {
  if (type === 1) return "CashFlow";
  if (type === 2) return "Transfer";
  if (type === 3) return "Exchange";
  return "BankAccount";
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

    for (const [key, child] of Object.entries(node as Record<string, unknown>)) {
      const childPath = path.length > 0 ? `${path}.${key}` : key;
      const error = validateNode(child, childPath);
      if (error != null) return error;
    }
    return null;
  };

  return validateNode(templateData, "");
}

export function useTemplatesLogic(filters: TemplateFilterParams) {
  const { t } = useSettings();
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
    openCreateForm,
    openDeleteConfirm,
    openEditForm,
    setEditingItem,
    setErrorMessage,
    setIsFormOpen,
    setIsSubmitting,
  } = useCrudPageState<TemplateListItemDto>();
  const [isPopulateOpen, setIsPopulateOpen] = useState(false);
  const [populateTemplateId, setPopulateTemplateId] = useState<string | null>(null);

  async function handleSubmit(values: TemplateFormValues) {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const autoPopulateValidationError = validateAutoPopulateFields(values.templateData);
      if (autoPopulateValidationError != null) {
        throw new Error(autoPopulateValidationError);
      }

      const payload: UpsertTemplateRequestDto = {
        description: values.description.trim().length === 0 ? null : values.description.trim(),
        isActive: editingTemplate?.isActive ?? true,
        name: values.name.trim(),
        templateDataJson: JSON.stringify(toStoredTemplateData(values.templateData)),
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

  function handleCreate(type: TemplateFormValues["templateType"]) {
    form.reset({
      ...emptyFormState,
      templateType: type,
      templateData: buildDefaultTemplateData(type),
    });
    setErrorMessage(null);
    openCreateForm();
  }

  async function handleEdit(template: TemplateListItemDto) {
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
      openEditForm(template);
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

  function handleCloseForm() {
    if (isSubmitting) {
      return;
    }

    closeForm();
    form.reset(emptyFormState);
  }

  function handleCloseDeleteConfirm() {
    if (isSubmitting) {
      return;
    }

    closeDeleteConfirm();
  }

  function handlePopulate(template: TemplateListItemDto) {
    setPopulateTemplateId(template.id);
    setIsPopulateOpen(true);
  }

  function handleClosePopulate() {
    setIsPopulateOpen(false);
    setPopulateTemplateId(null);
  }

  return {
    banks,
    closeDeleteConfirm: handleCloseDeleteConfirm,
    closeForm: handleCloseForm,
    counterparties,
    currencies,
    deletingTemplate,
    editingTemplate,
    errorMessage,
    form,
    handleCreate,
    handleDeleteConfirmed,
    handleEdit,
    handlePopulate,
    handleSubmit,
    isEditMode,
    isFormOpen,
    isLoading,
    isPopulateOpen,
    isSubmitting,
    openDeleteConfirm,
    populateTemplateId,
    templates,
    closePopulate: handleClosePopulate,
  };
}
