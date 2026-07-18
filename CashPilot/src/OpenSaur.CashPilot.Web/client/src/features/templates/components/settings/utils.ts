import type { UseFormClearErrors, UseFormGetValues } from "react-hook-form";
import type { TemplateFormValues } from "./TemplateForm";
import type { OptionItem } from "./types";

export const requiredWhenAutoHidden =
  <TFieldKey extends string>(
    getValues: UseFormGetValues<TemplateFormValues>,
    valuePath: TFieldKey,
    message: string,
  ) =>
  (value: unknown) => {
    const autoPopulateValue = getValues(
      `templateData.${valuePath}.autoPopulate` as never,
    ) as unknown;
    const showUiValue = getValues(
      `templateData.${valuePath}.showUi` as never,
    ) as unknown;
    const autoPopulate =
      typeof autoPopulateValue === "boolean" ? autoPopulateValue : undefined;
    const showUi = typeof showUiValue === "boolean" ? showUiValue : undefined;
    if (autoPopulate === true && showUi !== true) {
      if (value == null) return message;
      if (typeof value === "string" && value.trim().length === 0)
        return message;
    }
    return true;
  };

export const toOptions = <T>(
  items: T[],
  getLabel: (item: T) => string,
  getValue: (item: T) => string,
): OptionItem[] =>
  items.map((item) => ({
    label: getLabel(item),
    value: getValue(item),
  }));

export const clearErrorsWhenNotRequired = (
  clearErrors: UseFormClearErrors<TemplateFormValues>,
  items: Array<{ path: string; required: boolean }>,
) => {
  items.forEach(({ path, required }) => {
    if (!required) {
      clearErrors(path as never);
    }
  });
};
