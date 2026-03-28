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
      <DialogTitle>Login as</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3}>
          {options ? (
            <Stack spacing={0.75}>
              <Typography color="primary.main" variant="overline">
                Workspace
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
              Loading available users...
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
              noOptionsText="No matching users."
              onChange={(_, value) => {
                setSelectedUser(value);
              }}
              options={options?.users ?? []}
              renderInput={params => (
                <TextField
                  {...params}
                  label="User"
                  placeholder="Search users"
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
          Cancel
        </Button>
        <Button
          aria-busy={isSubmitting ? "true" : undefined}
          disabled={isLoading || isSubmitting || options === null || selectedUser === null}
          onClick={() => {
            void handleSubmit();
          }}
          variant="contained"
        >
          {isSubmitting ? "Continuing..." : "Continue"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
