export function formatAmount(value: number, locale: "en" | "vi") {
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

const inputNumberFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatInputNumberValue(value: string | number) {
  if (value === "" || value === undefined || value === null) return "";

  const stringValue = value.toString();
  const rawValue = stringValue.replace(/,/g, "");
  const num = parseFloat(rawValue);
  if (Number.isNaN(num)) return stringValue;

  const parts = rawValue.split(".");
  const formattedInt = inputNumberFormatter.format(parseInt(parts[0] || "0", 10));

  if (parts.length > 1) {
    return `${formattedInt}.${parts[1]}`;
  }

  return formattedInt;
}
