const fallbackTimeZones = [
  "UTC",
  "Etc/UTC",
  "Asia/Ho_Chi_Minh",
  "Asia/Saigon",
  "America/New_York",
  "Europe/London"
];

export function detectBrowserTimeZone() {
  const detectedTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return detectedTimeZone && detectedTimeZone.trim()
    ? detectedTimeZone
    : "UTC";
}

export function getSupportedTimeZones() {
  const runtimeTimeZones = typeof Intl.supportedValuesOf === "function"
    ? Intl.supportedValuesOf("timeZone")
    : [];

  return Array.from(new Set([
    detectBrowserTimeZone(),
    ...fallbackTimeZones,
    ...runtimeTimeZones
  ])).sort((left, right) => left.localeCompare(right));
}
