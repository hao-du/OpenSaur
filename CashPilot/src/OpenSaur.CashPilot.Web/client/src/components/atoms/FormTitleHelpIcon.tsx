import { IconButton, Popover, Typography } from "@mui/material";
import { CircleHelp } from "lucide-react";
import { useState, type MouseEvent } from "react";

type FormTitleHelpIconProps = {
  ariaLabel: string;
  message: string;
};

export function FormTitleHelpIcon({ ariaLabel, message }: FormTitleHelpIconProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const isOpen = anchorEl != null;

  const handleOpen = (event: MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <>
      <IconButton aria-label={ariaLabel} onClick={handleOpen} size="small" sx={{ ml: 0.75, mt: 0.25, p: 0.25 }}>
        <CircleHelp size={16} />
      </IconButton>
      <Popover
        anchorEl={anchorEl}
        anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
        onClose={handleClose}
        open={isOpen}
        transformOrigin={{ horizontal: "left", vertical: "top" }}
      >
        <Typography sx={{ maxWidth: 360, p: 1.25 }} variant="body2">
          {message}
        </Typography>
      </Popover>
    </>
  );
}
