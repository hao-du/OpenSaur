import { Autocomplete, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from "@mui/material";
import { useMemo, useState } from "react";
import type {
  UserForImpersonationByWorkspaceIdDto,
  UsersForImpersonationByWorkspaceIdDto
} from "../dtos/UsersForImpersonationByWorkspaceIdDto";

type WorkspaceImpersonationDialogProps = {
  errorMessage: string | null;
  isLoading: boolean;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: { userId: string; workspaceId: string }) => Promise<void>;
  usersForImpersonation: UsersForImpersonationByWorkspaceIdDto | null;
};

export function WorkspaceImpersonationDialog({
  errorMessage,
  isLoading,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
  usersForImpersonation
}: WorkspaceImpersonationDialogProps) {
  const [selectedUser, setSelectedUser] = useState<UserForImpersonationByWorkspaceIdDto | null>(null);
  const users = useMemo(() => usersForImpersonation?.users ?? [], [usersForImpersonation?.users]);

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    setSelectedUser(null);
    onClose();
  }

  async function handleSubmit() {
    if (selectedUser == null || usersForImpersonation == null) {
      return;
    }

    await onSubmit({
      userId: selectedUser.id,
      workspaceId: usersForImpersonation.workspaceId
    });
  }

  return (
    <Dialog fullWidth maxWidth="sm" onClose={handleClose} open={isOpen}>
      <DialogTitle>Login as</DialogTitle>
      <DialogContent dividers>
        <Typography color="primary" sx={{ mb: 1, textTransform: "uppercase" }} variant="caption">
          Workspace
        </Typography>
        <Typography sx={{ mb: 3 }} variant="h6">
          {usersForImpersonation?.workspaceName ?? ""}
        </Typography>
        <Autocomplete
          disabled={isLoading || isSubmitting}
          getOptionLabel={option => option.userName}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          loading={isLoading}
          onChange={(_, nextValue) => {
            setSelectedUser(nextValue);
          }}
          options={users}
          renderInput={params => (
            <TextField
              {...params}
              error={errorMessage != null}
              helperText={errorMessage ?? undefined}
              label="User"
              placeholder="Search users"
            />
          )}
          renderOption={(props, option) => (
            <Box component="li" {...props}>
              <Box>
                <Typography>{option.userName}</Typography>
                <Typography color="primary" variant="body2">{option.email}</Typography>
              </Box>
            </Box>
          )}
          value={selectedUser}
        />
      </DialogContent>
      <DialogActions>
        <Button disabled={isSubmitting} onClick={handleClose}>Cancel</Button>
        <Button disabled={selectedUser == null || isSubmitting} onClick={() => { void handleSubmit(); }} variant="contained">
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}
