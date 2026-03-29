import { useMemo, useState, type MouseEvent } from "react";
import {
  Chip,
  Popover,
  Stack,
  Typography
} from "@mui/material";

type RolePreviewItem = {
  id: string;
  name: string;
};

type RolePreviewListProps = {
  emptyLabel?: string;
  maxVisible?: number;
  roles: RolePreviewItem[];
};

export function RolePreviewList({
  emptyLabel = "No roles",
  maxVisible = 2,
  roles
}: RolePreviewListProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const visibleRoles = useMemo(() => roles.slice(0, maxVisible), [maxVisible, roles]);
  const overflowRoles = useMemo(() => roles.slice(maxVisible), [maxVisible, roles]);
  const overflowCount = overflowRoles.length;
  const overflowLabel = `Show ${overflowCount} more role${overflowCount === 1 ? "" : "s"}`;

  if (roles.length === 0) {
    return (
      <Typography color="text.secondary" variant="body2">
        {emptyLabel}
      </Typography>
    );
  }

  return (
    <>
      <Stack
        alignItems="center"
        direction="row"
        flexWrap="wrap"
        gap={0.75}
      >
        {visibleRoles.map(role => (
          <Chip
            key={role.id}
            label={role.name}
            size="small"
            variant="outlined"
          />
        ))}
        {overflowCount > 0 ? (
          <Chip
            aria-label={overflowLabel}
            clickable
            component="button"
            label={`+${overflowCount}`}
            onClick={(event: MouseEvent<HTMLElement>) => {
              setAnchorEl(event.currentTarget);
            }}
            size="small"
            sx={{ fontWeight: 600 }}
            variant="outlined"
          />
        ) : null}
      </Stack>
      <Popover
        anchorEl={anchorEl}
        anchorOrigin={{
          horizontal: "left",
          vertical: "bottom"
        }}
        onClose={() => {
          setAnchorEl(null);
        }}
        open={anchorEl !== null}
        transformOrigin={{
          horizontal: "left",
          vertical: "top"
        }}
      >
        <Stack
          spacing={1}
          sx={{ p: 2, minWidth: 180 }}
        >
          {overflowRoles.map(role => (
            <Typography key={role.id} variant="body2">
              {role.name}
            </Typography>
          ))}
        </Stack>
      </Popover>
    </>
  );
}
