import { useState } from "react";
import { Button, CircularProgress, Divider, Drawer, IconButton, Stack, TextField, Typography } from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { X } from "lucide-react";

export type OidcClientFilterValues = {
  clientId: string;
};

type OidcClientFiltersDrawerProps = {
  initialValues: OidcClientFilterValues;
  isOpen: boolean;
  onApply: (values: OidcClientFilterValues) => Promise<void> | void;
  onClose: () => void;
};

const defaultFilterValues: OidcClientFilterValues = {
  clientId: ""
};

export function OidcClientFiltersDrawer({
  initialValues,
  isOpen,
  onApply,
  onClose
}: OidcClientFiltersDrawerProps) {
  const { control, handleSubmit, reset } = useForm<OidcClientFilterValues>({
    values: initialValues
  });
  const [isApplying, setIsApplying] = useState(false);

  return (
    <Drawer
      anchor="right"
      onClose={onClose}
      open={isOpen}
      sx={{
        "& .MuiDrawer-paper": {
          p: 3,
          width: { sm: 480, xs: "100%" }
        }
      }}
    >
      <Stack spacing={3} sx={{ height: "100%" }}>
        <Stack alignItems="center" direction="row" justifyContent="space-between">
          <Typography component="h2" variant="h5">
            Filter applications
          </Typography>
          <IconButton aria-label="Close" onClick={onClose}>
            <X size={18} />
          </IconButton>
        </Stack>
        <Divider />
        <Stack
          component="form"
          noValidate
          onSubmit={handleSubmit(async values => {
            setIsApplying(true);
            try {
              await Promise.resolve(onApply(values));
            } finally {
              setIsApplying(false);
            }
          })}
          spacing={3}
          sx={{ flex: 1 }}
        >
          <Controller
            control={control}
            name="clientId"
            render={({ field }) => (
              <TextField
                {...field}
                fullWidth
                label="Client ID or name"
              />
            )}
          />
          <Stack direction="row" justifyContent="space-between" spacing={1.5} sx={{ mt: "auto" }}>
            <Button
              onClick={() => {
                reset(defaultFilterValues);
              }}
              type="button"
              variant="text"
            >
              Reset filters
            </Button>
            <Button
              disabled={isApplying}
              startIcon={isApplying ? <CircularProgress color="inherit" size={18} /> : undefined}
              type="submit"
              variant="contained"
            >
              {isApplying ? "Applying..." : "Apply"}
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Drawer>
  );
}
