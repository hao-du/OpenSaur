import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import type { BankDto } from "../../banks/dtos/BankDto";
import type { CounterpartyDto } from "../../counterparties/dtos/CounterpartyDto";
import type { CurrencyDto } from "../../currencies/dtos/CurrencyDto";
import {
  buildDefaultTemplateData,
  safeParseTemplateData,
  toStoredTemplateData,
} from "../../templates/components/settings/TemplateDataCodec";
import { TemplateFormDrawer } from "../../templates/components/settings/TemplateFormDrawer";
import type { TemplateFormValues } from "../../templates/components/settings/TemplateForm";
import type { TemplateType } from "../../templates/dtos/TemplateDto";
import type { OfflineTemplateRecord } from "../storages/offlineTemplatesStore";

type Props = {
  banks: BankDto[];
  counterparties: CounterpartyDto[];
  currencies: CurrencyDto[];
  editingTemplate?: OfflineTemplateRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: Omit<OfflineTemplateRecord, "updatedAt">) => void;
};

const emptyFormState: TemplateFormValues = {
  description: "",
  name: "",
  templateData: buildDefaultTemplateData("CashFlow"),
  templateType: "CashFlow",
};

function mapNumberToType(type: number): TemplateType {
  if (type === 1) return "CashFlow";
  if (type === 2) return "Transfer";
  if (type === 3) return "Exchange";
  return "BankAccount";
}

function mapTypeToNumber(type: TemplateType) {
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

    const field = node as { autoPopulate?: boolean; showUi?: boolean; value?: unknown };
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

export function OfflineTemplateFormDrawer({
  banks,
  counterparties,
  currencies,
  editingTemplate,
  isOpen,
  onClose,
  onSave,
}: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const form = useForm<TemplateFormValues>({ defaultValues: emptyFormState });

  useEffect(() => {
    if (!isOpen) {
      setErrorMessage(null);
      return;
    }

    if (editingTemplate == null) {
      setErrorMessage(null);
      form.reset(emptyFormState);
      return;
    }

    setErrorMessage(null);
    const type = mapNumberToType(editingTemplate.templateType);
    form.reset({
      description: editingTemplate.description ?? "",
      name: editingTemplate.name,
      templateData: safeParseTemplateData(editingTemplate.templateDataJson, type),
      templateType: type,
    });
  }, [editingTemplate, form, isOpen]);

  const handleSubmit = async (values: TemplateFormValues) => {
    setIsSubmitting(true);
    try {
      setErrorMessage(null);
      const autoPopulateValidationError = validateAutoPopulateFields(values.templateData);
      if (autoPopulateValidationError != null) {
        throw new Error(autoPopulateValidationError);
      }

      onSave({
        description: values.description.trim().length === 0 ? null : values.description.trim(),
        id: editingTemplate?.id ?? crypto.randomUUID(),
        isActive: editingTemplate?.isActive ?? true,
        name: values.name.trim(),
        templateDataJson: JSON.stringify(toStoredTemplateData(values.templateData)),
        templateType: mapTypeToNumber(values.templateType),
      });

      onClose();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save offline template.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <TemplateFormDrawer
      banks={banks}
      counterparties={counterparties}
      currencies={currencies}
      form={form}
      isEditMode={editingTemplate != null}
      isOpen={isOpen}
      errorMessage={errorMessage}
      isSubmitting={isSubmitting}
      onClose={onClose}
      onSubmit={handleSubmit}
    />
  );
}
