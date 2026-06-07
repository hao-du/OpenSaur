import type { TemplateField } from "./types";

export const shown = <T = string>(field?: TemplateField<T>) => field?.showUi === true;

export const replaceDateTokens = (value: string, todayIsoDate: string) => {
  const [year, month, day] = todayIsoDate.split("-");
  return value
    .replaceAll("{datetime-Day}", day ?? "")
    .replaceAll("{datetime-Month}", month ?? "")
    .replaceAll("{datetime-Year}", year ?? "");
};

export const resolve = (
  field: TemplateField | undefined,
  value: string,
  todayIsoDate: string,
) => {
  const raw =
    field?.autoPopulate === true && !field?.showUi
      ? (field.value ?? "")
      : value;
  return replaceDateTokens(raw, todayIsoDate);
};

export const resolveDate = (
  field: TemplateField | undefined,
  value: string,
  todayIsoDate: string,
) => {
  if (field?.autoPopulate !== true) {
    return resolve(field, value, todayIsoDate);
  }

  if (field.showUi === true) {
    return value.trim().length > 0 ? value : todayIsoDate;
  }

  return todayIsoDate;
};

export const initialValue = (
  field: TemplateField | undefined,
  todayIsoDate: string,
) =>
  replaceDateTokens(
    field?.autoPopulate === true ? (field.value ?? "") : "",
    todayIsoDate,
  );

export const initialDateValue = (
  field: TemplateField | undefined,
  todayIsoDate: string,
) => (field?.autoPopulate === true ? todayIsoDate : "");

export const isRequired = (field?: TemplateField) =>
  field?.showUi === true || (field?.autoPopulate === true && !field?.showUi);

export const resolveOptionalDescription = (
  field: TemplateField | undefined,
  value: string,
  todayIsoDate: string,
) => {
  const description = resolve(field, value, todayIsoDate).trim();
  return description.length > 0 ? description : undefined;
};

export const initialTagsValue = (field: TemplateField<string[]> | undefined) =>
  field?.autoPopulate === true ? [...(field.value ?? [])] : [];

export const resolveTags = (
  field: TemplateField<string[]> | undefined,
  value: string[],
) => {
  if (field?.autoPopulate === true && field.showUi !== true) {
    return [...(field.value ?? [])];
  }

  return [...value];
};
