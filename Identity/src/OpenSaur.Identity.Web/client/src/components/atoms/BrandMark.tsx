import { Stack, Typography } from "@mui/material";
import { ShieldCheck } from "../../shared/icons";

export function BrandMark() {
  return (
    <Stack
      alignItems="center"
      direction="row"
      spacing={1.5}
    >
      <ShieldCheck size={28} />
      <Typography
        component="span"
        variant="h6"
      >
        OpenSaur Identity
      </Typography>
    </Stack>
  );
}
