import { useState } from "react";
import { Button, CircularProgress, Stack } from "@mui/material";
import { useForm } from "react-hook-form";
import { DropDown } from "../../../components/atoms/DropDown";
import { Text } from "../../../components/atoms/Text";
import { DrawerPanel } from "../../../components/organisms/DrawerPanel";
import { layoutStyles } from "../../../infrastructure/theme/theme";

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
  const { control, handleSubmit, reset } = useForm<UserFilterValues>({
    values: initialValues
  });
  const [isApplying, setIsApplying] = useState(false);

  return (
    <DrawerPanel isOpen={isOpen} onClose={onClose} title="Filter users">
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
          sx={layoutStyles.drawerBody}
        >
          <Text control={control} label="Name, email, or role" name="search" />
          <DropDown
            control={control}
            label="Status"
            name="status"
            options={[
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
              { label: "All", value: "all" }
            ]}
          />
          <Stack direction="row" justifyContent="space-between" spacing={1.5} sx={layoutStyles.formFooterRow}>
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
    </DrawerPanel>
  );
}
