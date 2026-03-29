import { useEffect, useState } from "react";
import {
  Alert,
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import type {
  ImpersonationOptionsResponse,
  ImpersonationOptionsUser
} from "../../auth/api/authApi";
import { usePreferences } from "../../preferences/PreferenceProvider";

type WorkspaceImpersonationDialogProps = {
  errorMessage: string | null;
  isLoading: boolean;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (request: { userId: string | null; workspaceId: string; }) => Promise<void>;
  options: ImpersonationOptionsResponse | null;
};

export function WorkspaceImpersonationDialog({
  errorMessage,
  isLoading,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
  options
}: WorkspaceImpersonationDialogProps) {
  const { t } = usePreferences();
  const [selectedUser, setSelectedUser] = useState<ImpersonationOptionsUser | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedUser(null);
    }
  }, [isOpen, options?.workspaceId]);

  async function handleSubmit() {
    if (!options || !selectedUser) {
      return;
    }

    await onSubmit({
      userId: selectedUser.id,
      workspaceId: options.workspaceId
    });
  }

  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      onClose={onClose}
      open={isOpen}
    >
      <DialogTitle>{t("workspaces.impersonation.title")}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          {options ? (
            <Stack spacing={0.75}>
              <Typography color="primary.main" variant="overline">
                {t("workspaces.impersonation.workspace")}
              </Typography>
              <Typography variant="h6">{options.workspaceName}</Typography>
            </Stack>
          ) : null}
          {errorMessage ? (
            <Alert severity="error">
              {errorMessage}
            </Alert>
          ) : null}
          {isLoading ? (
            <Typography color="text.secondary">
              {t("workspaces.impersonation.loadingUsers")}
            </Typography>
          ) : (
            <Autocomplete
              autoHighlight
              filterOptions={(availableUsers, state) => {
                const normalizedInput = state.inputValue.trim().toLowerCase();
                if (!normalizedInput) {
                  return availableUsers;
                }

                return availableUsers.filter(user =>
                  user.userName.toLowerCase().includes(normalizedInput)
                  || user.email.toLowerCase().includes(normalizedInput));
              }}
              fullWidth
              getOptionLabel={option => option.userName}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              noOptionsText={t("workspaces.impersonation.noMatchingUsers")}
              onChange={(_, value) => {
                setSelectedUser(value);
              }}
              options={options?.users ?? []}
              renderInput={params => (
                <TextField
                  {...params}
                  label={t("workspaces.impersonation.user")}
                  placeholder={t("workspaces.impersonation.searchUsers")}
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Stack spacing={0.25}>
                    <Typography>{option.userName}</Typography>
                    <Typography color="text.secondary" variant="body2">
                      {option.email}
                    </Typography>
                  </Stack>
                </li>
              )}
              slotProps={{
                popper: {
                  modifiers: [
                    {
                      enabled: false,
                      name: "flip"
                    }
                  ],
                  placement: "bottom-start"
                }
              }}
              value={selectedUser}
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          variant="text"
        >
          {t("workspaces.impersonation.cancel")}
        </Button>
        <Button
          aria-busy={isSubmitting ? "true" : undefined}
          disabled={isLoading || isSubmitting || options === null || selectedUser === null}
          onClick={() => {
            void handleSubmit();
          }}
          variant="contained"
        >
          {isSubmitting ? t("workspaces.impersonation.continuing") : t("workspaces.impersonation.continue")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
