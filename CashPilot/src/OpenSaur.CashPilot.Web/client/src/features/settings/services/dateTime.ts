export function getTodayIsoDateByTimeZone(timeZone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric"
  });
  const parts = formatter.formatToParts(new Date());
  const year = parts.find(x => x.type === "year")?.value ?? "1970";
  const month = parts.find(x => x.type === "month")?.value ?? "01";
  const day = parts.find(x => x.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}
