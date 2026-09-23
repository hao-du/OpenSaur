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

  if (rawValue === "-") return "-";

  const num = parseFloat(rawValue);
  if (Number.isNaN(num)) return stringValue;

  const isNegative = rawValue.startsWith("-");
  const unsignedRawValue = isNegative ? rawValue.slice(1) : rawValue;

  const parts = unsignedRawValue.split(".");
  const formattedInt = inputNumberFormatter.format(parseInt(parts[0] || "0", 10));

  const result = parts.length > 1 ? `${formattedInt}.${parts[1]}` : formattedInt;
  return isNegative ? `-${result}` : result;
}
