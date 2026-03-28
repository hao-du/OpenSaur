import { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Button,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  MenuItem,
  Stack,
  Typography
} from "@mui/material";
import { ControlledTextField } from "../../../components/molecules/controlled";
import { X } from "../../../shared/icons";

export type UserFilterValues = {
  search: string;
  status: "active" | "all" | "inactive";
};

type UserFiltersDrawerProps = {
  initialValues: UserFilterValues;
  isOpen: boolean;
  onApply: (values: UserFilterValues) => Promise<void> | void;
  onClose: () => void;
};

const defaultFilterValues: UserFilterValues = {
  search: "",
  status: "active"
};

export function UserFiltersDrawer({
  initialValues,
  isOpen,
  onApply,
  onClose
}: UserFiltersDrawerProps) {
  const {
    control,
    handleSubmit,
    reset
  } = useForm<UserFilterValues>({
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
            Filter users
          </Typography>
          <IconButton aria-label="Close user filters" onClick={onClose}>
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
              await new Promise(resolve => {
                window.setTimeout(resolve, 0);
              });
              await onApply(values);
            } finally {
              setIsApplying(false);
            }
          })}
          spacing={3}
          sx={{ flex: 1 }}
        >
          <ControlledTextField
            control={control}
            label="Search users"
            name="search"
          />
          <ControlledTextField
            control={control}
            label="User status"
            name="status"
            select
          >
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </ControlledTextField>
          <Stack
            direction="row"
            justifyContent="space-between"
            spacing={1.5}
            sx={{ mt: "auto" }}
          >
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
              aria-busy={isApplying}
              disabled={isApplying}
              startIcon={isApplying
                ? <CircularProgress color="inherit" size={18} />
                : undefined}
              type="submit"
              variant="contained"
            >
              {isApplying ? "Applying filters..." : "Apply filters"}
            </Button>
          </Stack>
        </Stack>
      </Stack>
    </Drawer>
  );
}
