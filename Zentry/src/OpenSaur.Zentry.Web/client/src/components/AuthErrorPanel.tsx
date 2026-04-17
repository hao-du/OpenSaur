import { Alert, Button, Stack } from "@mui/material";

type AuthErrorPanelProps = {
  message: string;
  onRetry: () => void | Promise<void>;
};

export function AuthErrorPanel({ message, onRetry }: AuthErrorPanelProps) {
  return (
    <Stack spacing={1.5}>
      <Alert
        action={(
          <Button color="inherit" onClick={() => void onRetry()} size="small">
            Retry
          </Button>
        )}
        severity="error"
      >
        {message}
      </Alert>
    </Stack>
  );
}
