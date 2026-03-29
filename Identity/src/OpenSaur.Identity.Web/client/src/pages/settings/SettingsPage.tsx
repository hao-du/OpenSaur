import { useEffect, useState } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  CircularProgress,
  MenuItem,
  Paper,
  Stack,
  TextField
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { IntlProvider } from "react-intl";
import { ProtectedShellTemplate } from "../../components/templates";
import { useLocalizedFormatting } from "../../features/localization/formatting";
import { getLanguageTag } from "../../features/preferences/locale";
import { usePreferences } from "../../features/preferences/PreferenceProvider";
import { useUpdateCurrentUserSettings } from "../../features/preferences/hooks";

type SettingsFormValues = {
  locale: "en" | "vi";
  timeZone: string;
};

function SettingsDateTimePreviewContent({
  value
}: {
  value: string;
}) {
  const { formatDate, formatTime } = useLocalizedFormatting();

  return (
    <Stack spacing={1}>
      <Alert severity="info">
        {formatDate(value, {
          day: "numeric",
          month: "long",
          weekday: "long",
          year: "numeric"
        })} {" "}
        {formatTime(value, {
          hour: "numeric",
          minute: "2-digit",
          timeZoneName: "short"
        })}
      </Alert>
    </Stack>
  );
}

export function SettingsPage() {
  const {
    preferences,
    setPreferences,
    supportedTimeZones,
    t
  } = usePreferences();
  const {
    errorMessage,
    isSaving,
    resetError,
    updateSettings
  } = useUpdateCurrentUserSettings();
  const [isSaved, setIsSaved] = useState(false);
  const previewDate = "2026-03-29T08:30:00.000Z";
  const {
    control,
    handleSubmit,
    reset,
    watch
  } = useForm<SettingsFormValues>({
    values: preferences
  });
  const selectedLocale = watch("locale");
  const selectedTimeZone = watch("timeZone");
  const previewLanguageTag = getLanguageTag(selectedLocale);
  const previewTimeZone = selectedTimeZone.trim() || preferences.timeZone;

  useEffect(() => {
    reset(preferences);
  }, [preferences, reset]);

  async function handleSave(values: SettingsFormValues) {
    resetError();
    setIsSaved(false);

    const savedSettings = await updateSettings(values);
    const nextPreferences = {
      locale: savedSettings.locale === "vi" ? "vi" : values.locale,
      timeZone: savedSettings.timeZone ?? values.timeZone
    } satisfies SettingsFormValues;

    setPreferences(nextPreferences);
    setIsSaved(true);
  }

  return (
    <ProtectedShellTemplate
      subtitle={t("settings.subtitle")}
      title={t("settings.title")}
    >
      <Paper
        elevation={0}
        sx={{
          border: "1px solid rgba(11,110,79,0.12)",
          p: { xs: 3, md: 4 }
        }}
      >
        <Stack
          component="form"
          noValidate
          onSubmit={handleSubmit(handleSave)}
          spacing={3}
        >
          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
          {isSaved ? <Alert severity="success">{t("settings.saved")}</Alert> : null}
          <Controller
            control={control}
            name="locale"
            render={({ field }) => (
              <TextField
                fullWidth
                label={t("settings.locale")}
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
            <Paper elevation={0} sx={{ border: "1px solid rgba(11,110,79,0.12)", p: 2 }}>
              <Stack spacing={1.5}>
                <strong>{t("settings.previewTitle")}</strong>
                <IntlProvider
                  key={`${previewLanguageTag}:${previewTimeZone}`}
                  locale={previewLanguageTag}
                  messages={{}}
                  timeZone={previewTimeZone}
                >
                  <SettingsDateTimePreviewContent value={previewDate} />
                </IntlProvider>
              </Stack>
            </Paper>
          </Stack>
          <Stack direction="row" justifyContent="flex-end">
            <Button
              aria-busy={isSaving}
              disabled={isSaving}
              startIcon={isSaving
                ? <CircularProgress color="inherit" size={18} />
                : undefined}
              type="submit"
              variant="contained"
            >
              {isSaving ? t("settings.saving") : t("settings.save")}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </ProtectedShellTemplate>
  );
}
