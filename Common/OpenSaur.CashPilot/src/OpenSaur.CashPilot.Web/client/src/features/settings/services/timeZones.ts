const fallbackTimeZones = [
  "Africa/Cairo",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/New_York",
  "Asia/Bangkok",
  "Asia/Ho_Chi_Minh",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Europe/Berlin",
  "Europe/London",
  "Europe/Paris",
  "UTC"
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
