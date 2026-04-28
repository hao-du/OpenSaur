import { Alert, Button, CircularProgress, Divider, Drawer, IconButton, Stack, Typography } from "@mui/material";
import { X } from "lucide-react";
import { useForm } from "react-hook-form";
import { Text } from "../../../components/atoms/Text";
import { layoutStyles } from "../../../infrastructure/theme/theme";

type ResetUserPasswordDrawerProps = {
  errorMessage: string | null;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (password: string) => Promise<void>;
  userName?: string;
};

type ResetUserPasswordFormValues = {
  password: string;
};

export function ResetUserPasswordDrawer({
  errorMessage,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
  userName
}: ResetUserPasswordDrawerProps) {
  const { control, handleSubmit, reset } = useForm<ResetUserPasswordFormValues>({
    values: {
      password: ""
    }
  });

  return (
    <Drawer anchor="right" open={isOpen} sx={layoutStyles.drawerPaperNarrow}>
      <Stack spacing={3} sx={layoutStyles.drawerContent}>
        <Stack alignItems="center" direction="row" justifyContent="space-between">
          <Stack spacing={0.5}>
            <Typography component="h2" variant="h5">
              Reset Password
            </Typography>
            <Typography color="text.secondary">{userName ?? ""}</Typography>
          </Stack>
          <IconButton aria-label="Close" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </Stack>
        <Divider />
        <Stack
          component="form"
          noValidate
          onSubmit={handleSubmit(async values => {
            await onSubmit(values.password);
            reset({ password: "" });
          })}
          spacing={3}
          sx={layoutStyles.drawerBody}
        >
          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
          <Text
            control={control}
            disabled={isSubmitting}
            label="New temporary password"
            name="password"
            required
            rules={{
              minLength: {
                message: "Password must be at least 8 characters.",
                value: 8
              },
              required: "New temporary password is required."
            }}
            type="password"
          />
          <Typography color="text.secondary" variant="body2">
            The user will be required to change this password on next sign-in.
          </Typography>
          <Stack direction="row" justifyContent="flex-end" spacing={1.5}>
            <Button onClick={onClose} type="button" variant="text">
              Cancel
            </Button>
            <Button
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress color="inherit" size={18} /> : undefined}
              type="submit"
              variant="contained"
            >
              {isSubmitting ? "Saving..." : "Reset password"}
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Drawer>
  );
}
