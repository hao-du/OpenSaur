import { Alert, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { useForm } from "react-hook-form";
import { Text } from "../../../components/atoms/Text";
import { DrawerPanel } from "../../../components/organisms/DrawerPanel";
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
    <DrawerPanel isOpen={isOpen} onClose={onClose} subtitle={userName ?? ""} title="Reset Password">
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
    </DrawerPanel>
  );
}
