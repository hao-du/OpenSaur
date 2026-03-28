import { Divider, Paper, Stack, Typography } from "@mui/material";

type ComingSoonStateProps = {
  description: string;
};

export function ComingSoonState({ description }: ComingSoonStateProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid rgba(31,60,136,0.12)",
        p: { xs: 3, md: 4 }
      }}
    >
      <Stack spacing={2}>
        <Typography
          component="h2"
          variant="h5"
        >
          Coming soon
        </Typography>
        <Divider />
        <Typography color="text.secondary">
          {description}
        </Typography>
      </Stack>
    </Paper>
  );
}
