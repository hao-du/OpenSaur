import { Alert, Button, CircularProgress, Divider, Stack, TextField, Typography } from "@mui/material";
import { Controller, useForm } from "react-hook-form";

type OidcClientFormValues = {
  clientId: string;
  clientSecret: string;
  displayName: string;
  postLogoutRedirectUrisText: string;
  redirectUrisText: string;
  scope: string;
};

type OidcClientFormProps = {
  errorMessage: string | null;
  initialValues: OidcClientFormValues;
  isEditMode: boolean;
  isSubmitting: boolean;
  onSubmit: (values: {
    clientId: string;
    clientSecret: string;
    displayName: string;
    postLogoutRedirectUris: string[];
    redirectUris: string[];
    scope: string;
  }) => Promise<void>;
};

function splitUris(urisText: string) {
  return urisText
    .split(/\r?\n/)
    .map(uri => uri.trim())
    .filter(uri => uri.length > 0);
}

export function OidcClientForm({
  errorMessage,
  initialValues,
  isEditMode,
  isSubmitting,
  onSubmit
}: OidcClientFormProps) {
  const { control, handleSubmit, watch } = useForm<OidcClientFormValues>({
    values: initialValues
  });
  const redirectUriPreview = splitUris(watch("redirectUrisText"));
  const postLogoutRedirectUriPreview = splitUris(watch("postLogoutRedirectUrisText"));

  return (
    <Stack
      component="form"
      noValidate
      onSubmit={handleSubmit(async values => {
        await onSubmit({
          clientId: values.clientId,
          clientSecret: values.clientSecret,
          displayName: values.displayName,
          postLogoutRedirectUris: splitUris(values.postLogoutRedirectUrisText),
          redirectUris: splitUris(values.redirectUrisText),
          scope: values.scope
        });
      })}
      spacing={3}
    >
      {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
      <Stack spacing={2}>
        <Typography variant="h6">Client</Typography>
        <Controller
          control={control}
          name="displayName"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              disabled={isSubmitting}
              error={fieldState.error != null}
              fullWidth
              helperText={fieldState.error?.message ?? "How this client appears in Zentry."}
              label="Display name"
              required
            />
          )}
          rules={{ required: "Display name is required." }}
        />
        <Controller
          control={control}
          name="clientId"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              disabled={isSubmitting}
              error={fieldState.error != null}
              fullWidth
              helperText={fieldState.error?.message}
              label="Client ID"
              required
            />
          )}
          rules={{ required: "Client ID is required." }}
        />
        <Controller
          control={control}
          name="clientSecret"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              disabled={isSubmitting}
              error={fieldState.error != null}
              fullWidth
              helperText={fieldState.error?.message ?? (isEditMode
                ? "Leave blank to keep the current client secret."
                : "Client secret is required for managed Zentry clients.")}
              label="Client secret"
              required={!isEditMode}
              type="password"
            />
          )}
          rules={isEditMode ? undefined : { required: "Client secret is required." }}
        />
        <Controller
          control={control}
          name="scope"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              disabled={isSubmitting}
              error={fieldState.error != null}
              fullWidth
              helperText={fieldState.error?.message ?? "Space-separated scopes issued to this application."}
              label="Scope"
              required
            />
          )}
          rules={{ required: "Scope is required." }}
        />
        <Controller
          control={control}
          name="redirectUrisText"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              disabled={isSubmitting}
              error={fieldState.error != null}
              fullWidth
              helperText={fieldState.error?.message ?? "One absolute redirect URI per line."}
              label="Redirect URIs"
              minRows={4}
              multiline
              required
            />
          )}
          rules={{
            required: "At least one redirect URI is required.",
            validate: value => splitUris(String(value)).length > 0 || "At least one redirect URI is required."
          }}
        />
        <Controller
          control={control}
          name="postLogoutRedirectUrisText"
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              disabled={isSubmitting}
              error={fieldState.error != null}
              fullWidth
              helperText={fieldState.error?.message ?? "Optional absolute post-logout redirect URI per line."}
              label="Post-logout redirect URIs"
              minRows={4}
              multiline
            />
          )}
          rules={{}}
        />
        {redirectUriPreview.length > 0 ? (
          <Alert severity="info">
            Redirect URIs: {redirectUriPreview.join(", ")}
          </Alert>
        ) : null}
        {postLogoutRedirectUriPreview.length > 0 ? (
          <Alert severity="info">
            Post-logout redirect URIs: {postLogoutRedirectUriPreview.join(", ")}
          </Alert>
        ) : null}
      </Stack>
      <Divider />
      <Stack direction="row" justifyContent="flex-end">
        <Button
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress color="inherit" size={18} /> : undefined}
          type="submit"
          variant="contained"
        >
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </Stack>
    </Stack>
  );
}
