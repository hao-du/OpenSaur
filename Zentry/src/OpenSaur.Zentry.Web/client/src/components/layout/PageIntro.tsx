import { Stack, Typography } from "@mui/material";

type PageIntroProps = {
  subtitle?: string;
  title: string;
};

export function PageIntro({ subtitle, title }: PageIntroProps) {
  return (
    <Stack spacing={1}>
      <Typography component="h1" variant="h3">
        {title}
      </Typography>
      {subtitle ? (
        <Typography color="text.secondary">
          {subtitle}
        </Typography>
      ) : null}
    </Stack>
  );
}
