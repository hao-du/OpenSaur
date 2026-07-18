import { useEffect, useMemo, useState } from "react";
import { Alert, Autocomplete, Box, CircularProgress, MenuItem, Stack, TextField } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { ActionButton } from "../../../components/atoms/ActionButton";
import { DefaultLayout } from "../../../components/layouts/DefaultLayout";
import { getApiErrorMessage } from "../../../infrastructure/http/apiErrorHelpers";
import { detectBrowserTimeZone, getSupportedTimeZones } from "../services/timeZones";
import { useSettingsQuery } from "../hooks/useSettingsQuery";
import { useUpdateSettings } from "../hooks/useUpdateSettings";
import { useSettings } from "../provider/SettingProvider";

type SettingsFormValues = {
  locale: "en" | "vi";
  timeZone: string;
};

const defaultSettings: SettingsFormValues = {
  locale: "en",
  timeZone: detectBrowserTimeZone()
};

function formatPreviewDate(locale: SettingsFormValues["locale"], timeZone: string, invalidTimeZoneMessage: string) {
  const languageTag = locale === "vi" ? "vi-VN" : "en-US";
  const previewDate = new Date("2026-03-29T08:30:00.000Z");

  try {
    return new Intl.DateTimeFormat(languageTag, {
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      month: "long",
      timeZone,
      timeZoneName: "short",
      weekday: "long",
      year: "numeric"
    }).format(previewDate);
  } catch {
    return invalidTimeZoneMessage;
  }
}

export function SettingsPage() {
  const { applyServerSettings, t } = useSettings();
  const { data: settings, error: settingsError, isLoading } = useSettingsQuery();
  const { errorMessage, isSaving, resetError, updateSettings } = useUpdateSettings();
  const supportedTimeZones = useMemo(() => getSupportedTimeZones(), []);
  const [isSaved, setIsSaved] = useState(false);
  const loadErrorMessage = settingsError
    ? getApiErrorMessage(settingsError, t("settings.loadError"))
    : null;
  const { control, handleSubmit, reset, watch } = useForm<SettingsFormValues>({
    values: {
      locale: settings?.locale ?? defaultSettings.locale,
      timeZone: settings?.timeZone ?? defaultSettings.timeZone
    }
  });
  const selectedLocale = watch("locale");
  const selectedTimeZone = watch("timeZone");
  const previewTimeZone = selectedTimeZone.trim() || defaultSettings.timeZone;
  const previewText = formatPreviewDate(selectedLocale, previewTimeZone, t("settings.previewInvalidTimeZone"));

  useEffect(() => {
    if (settings == null) {
      return;
    }

    reset({
      locale: settings.locale ?? defaultSettings.locale,
      timeZone: settings.timeZone ?? defaultSettings.timeZone
    });
  }, [settings, reset]);

  async function handleSave(values: SettingsFormValues) {
    resetError();
    setIsSaved(false);

    const savedSettings = await updateSettings(values);
    applyServerSettings(savedSettings);
    reset({
      locale: savedSettings.locale ?? values.locale,
      timeZone: savedSettings.timeZone ?? values.timeZone
    });
    setIsSaved(true);
  }

  return (
    <DefaultLayout
      subtitle={t("settings.subtitle")}
      title={t("settings.title")}
    >
      <Box sx={{ bgcolor: "background.paper", border: "1px solid rgba(11,110,79,0.12)", p: { md: 4, xs: 3 } }}>
        {isLoading ? (
          <Stack alignItems="center" justifyContent="center" spacing={2} sx={{ minHeight: 260 }}>
            <CircularProgress size={28} />
            <span>{t("settings.loading")}</span>
          </Stack>
        ) : (
          <Stack
            component="form"
            noValidate
            onSubmit={handleSubmit(handleSave)}
            spacing={3}
          >
            {loadErrorMessage ? <Alert severity="error">{loadErrorMessage}</Alert> : null}
            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
            {isSaved ? <Alert severity="success">{t("settings.saved")}</Alert> : null}
            <Controller
              control={control}
              name="locale"
              render={({ field }) => (
                <TextField
                  fullWidth
                  label={t("settings.language")}
                  onChange={field.onChange}
                  select
                  value={field.value}
                >
                  <MenuItem value="en">{t("settings.language.english")}</MenuItem>
                  <MenuItem value="vi">{t("settings.language.vietnamese")}</MenuItem>
                </TextField>
              )}
            />
            <Controller
              control={control}
              name="timeZone"
              render={({ field }) => (
                <Autocomplete
                  autoHighlight
                  freeSolo
                  onChange={(_, value) => {
                    field.onChange(value ?? "");
                  }}
                  onInputChange={(_, value) => {
                    field.onChange(value);
                  }}
                  options={supportedTimeZones}
                  renderInput={params => (
                    <TextField
                      {...params}
                      label={t("settings.timeZone")}
                    />
                  )}
                  value={field.value}
                />
              )}
            />
            <Stack spacing={1}>
              <Alert severity="info">{t("settings.previewDescription")}</Alert>
              <Box sx={{ border: "1px solid rgba(11,110,79,0.12)", p: 2 }}>
                {previewText}
              </Box>
            </Stack>
            <Stack direction="row" justifyContent="flex-end">
              <ActionButton
                aria-busy={isSaving}
                disabled={isSaving}
                startIcon={isSaving ? <CircularProgress color="inherit" size={18} /> : undefined}
                type="submit"
              >
                {isSaving ? t("action.saving") : t("action.save")}
              </ActionButton>
            </Stack>
          </Stack>
        )}
      </Box>
    </DefaultLayout>
  );
}
