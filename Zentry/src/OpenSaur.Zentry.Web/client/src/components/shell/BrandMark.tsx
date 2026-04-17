import { Stack, Typography } from "@mui/material";

export function BrandMark() {
  return (
    <Stack spacing={0.5}>
      <Typography
        color="primary.main"
        sx={{ fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.18em" }}
      >
        OpenSaur
      </Typography>
      <Typography variant="h5">
        Zentry
      </Typography>
      <Typography color="text.secondary" variant="body2">
        Workspace administration shell
      </Typography>
    </Stack>
  );
}
