import { Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";

type ConfirmationDialogProps = {
  cancelLabel?: string;
  confirmLabel?: string;
  isConfirming?: boolean;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
};

export function ConfirmationDialog({
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  isConfirming = false,
  message,
  onClose,
  onConfirm,
  open,
  title
}: ConfirmationDialogProps) {
  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      onClose={isConfirming ? undefined : onClose}
      open={open}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography color="text.secondary">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button disabled={isConfirming} onClick={onClose} variant="text">
          {cancelLabel}
        </Button>
        <Button
          color="error"
          disabled={isConfirming}
          onClick={onConfirm}
          startIcon={isConfirming ? <CircularProgress color="inherit" size={18} /> : undefined}
          variant="contained"
        >
          {isConfirming ? "Working..." : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
