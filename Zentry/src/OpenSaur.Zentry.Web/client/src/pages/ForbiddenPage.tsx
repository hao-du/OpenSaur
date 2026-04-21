import { Button, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { DefaultLayout } from "../components/layouts/DefaultLayout";

export function ForbiddenPage() {
  const navigate = useNavigate();

  return (
    <DefaultLayout
      subtitle="Your account is signed in, but it does not have permission to use this area."
      title="403 Forbidden"
    >
      <Stack spacing={3}>
        <Typography>
          Applications management is restricted to super administrators in Zentry.
        </Typography>
        <Typography color="text.secondary">
          If you believe you should have access, contact an administrator or return to the dashboard.
        </Typography>
        <Stack direction={{ md: "row", xs: "column" }} spacing={2}>
          <Button
            onClick={() => {
              navigate("/", { replace: true });
            }}
            variant="contained"
          >
            Back to dashboard
          </Button>
          <Button
            onClick={() => {
              navigate("/applications", { replace: true });
            }}
            variant="outlined"
          >
            Try again
          </Button>
        </Stack>
      </Stack>
    </DefaultLayout>
  );
}
