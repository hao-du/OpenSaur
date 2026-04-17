import type { PropsWithChildren } from "react";
import { Card, CardContent } from "@mui/material";

export function PageSectionCard({ children }: PropsWithChildren) {
  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid rgba(11,110,79,0.10)",
        boxShadow: "0 20px 50px rgba(15, 23, 42, 0.08)"
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {children}
      </CardContent>
    </Card>
  );
}
