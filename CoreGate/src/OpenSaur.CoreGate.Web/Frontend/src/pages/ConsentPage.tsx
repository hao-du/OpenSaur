import {
  Alert,
  Box,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography
} from "@mui/material";
import { CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { getConsentDetails, submitConsent } from "../api/auth";
import { Card } from "../components/molecules/Card";
import { PageLayout } from "../components/templates/PageLayout";
import type { ConsentDetailsResponse } from "../dtos/ConsentDtos";

export function ConsentPage() {
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const returnUrl = searchParams.get("returnUrl") ?? "";

  const [consentDetails, setConsentDetails] = useState<ConsentDetailsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function fetchConsent() {
      if (!returnUrl) {
        setError("Missing required returnUrl parameter.");
        setLoading(false);
        return;
      }

      try {
        const details = await getConsentDetails(returnUrl);
        if (active) {
          setConsentDetails(details);
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load authorization details.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchConsent();

    return () => {
      active = false;
    };
  }, [returnUrl]);

  const handleDecision = async (decision: "accept" | "reject") => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await submitConsent({
        decision,
        returnUrl
      });
      window.location.href = response.redirectUrl;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to process consent decision.");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageLayout background="auth">
        <Card title="Authorization Request" subtitle="Loading authorization details...">
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={32} />
          </Box>
        </Card>
      </PageLayout>
    );
  }

  const clientName = consentDetails?.clientDisplayName ?? "The requesting application";

  return (
    <PageLayout background="auth">
      <Card
        title="Authorize Application"
        subtitle={`${clientName} is requesting access to your CoreGate account.`}
      >
        <Stack spacing={3}>
          {error && <Alert severity="error">{error}</Alert>}

          <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
              Requested Permissions:
            </Typography>
            <List dense disablePadding>
              {(consentDetails?.scopes ?? []).map((scope) => (
                <ListItem key={scope.name} sx={{ px: 0, py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 28, color: "primary.main", display: "flex", alignItems: "center" }}>
                    <CheckCircle2 size={18} />
                  </ListItemIcon>
                  <ListItemText
                    primary={scope.name}
                    secondary={scope.description}
                    primaryTypographyProps={{ fontWeight: 600, fontSize: "0.9rem" }}
                    secondaryTypographyProps={{ fontSize: "0.8rem" }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>

          <Typography variant="body2" color="text.secondary">
            By clicking <strong>Allow Access</strong>, you authorize {clientName} to access the items listed above.
          </Typography>

          <Stack direction="row" spacing={2} sx={{ pt: 1 }}>
            <Button
              variant="outlined"
              color="inherit"
              fullWidth
              disabled={submitting}
              onClick={() => handleDecision("reject")}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              disabled={submitting}
              onClick={() => handleDecision("accept")}
            >
              {submitting ? <CircularProgress size={24} color="inherit" /> : "Allow Access"}
            </Button>
          </Stack>
        </Stack>
      </Card>
    </PageLayout>
  );
}
