import { CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import { useSettings } from "../../features/settings/provider/SettingProvider";
import { layoutStyles } from "../../infrastructure/theme/theme";
import { ActionButton } from "./ActionButton";
import { BodyText } from "./BodyText";

type ConfirmModalProps = {
  cancelLabel?: string;
  confirmLabel?: string;
  isConfirming?: boolean;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
};

export function ConfirmModal({
  cancelLabel,
  confirmLabel,
  isConfirming = false,
  message,
  onClose,
  onConfirm,
  open,
  title
}: ConfirmModalProps) {
  const { t } = useSettings();
  const resolvedCancelLabel = cancelLabel ?? t("action.cancel");
  const resolvedConfirmLabel = confirmLabel ?? t("action.confirm");

  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      onClose={isConfirming ? undefined : onClose}
      open={open}
    >
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <BodyText>{message}</BodyText>
      </DialogContent>
      <DialogActions sx={layoutStyles.dialogActions}>
        <ActionButton disabled={isConfirming} onClick={onClose} variant="text">
          {resolvedCancelLabel}
        </ActionButton>
        <ActionButton
          color="error"
          disabled={isConfirming}
          onClick={onConfirm}
          startIcon={isConfirming ? <CircularProgress color="inherit" size={18} /> : undefined}
        >
          {isConfirming ? t("action.working") : resolvedConfirmLabel}
        </ActionButton>
      </DialogActions>
    </Dialog>
  );
}
