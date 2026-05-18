import { Paper, Skeleton, Stack } from "@mui/material";

type Props = {
  rows?: number;
};

export function DashboardCardSkeleton({ rows = 4 }: Props) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, height: "100%", display: "flex", flexDirection: "column" }}>
      <Skeleton variant="text" width="55%" height={36} />
      <Stack spacing={0.8} sx={{ mt: 0.5, flex: 1 }}>
        {Array.from({ length: rows }).map((_, index) => (
          <Stack key={index} direction="row" justifyContent="space-between" spacing={2}>
            <Skeleton variant="text" width={`${35 + (index % 2) * 10}%`} />
            <Skeleton variant="text" width={`${30 + (index % 3) * 10}%`} />
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}
